import { NextRequest, NextResponse } from "next/server";
import {
  ensureValidLinkedInPageToken,
  publishToLinkedIn,
  LinkedInApiError,
  refreshLinkedInAccessToken,
  decryptToken,
  encryptToken,
} from "@/lib/linkedin";
import dbConnect from "@/lib/mongodb";
import ScheduledPost, { IScheduledPost } from "@/models/ScheduledPost";
import User, { IUser } from "@/models/User";
import { auth } from "@/auth";
import mongoose, { HydratedDocument } from "mongoose";


export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  
  const authHeader = request.headers.get("authorization");
  const session = await auth();
  
  const isAuthorized = 
    (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) || 
    (!!session?.user);

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    // 1. Fetch pending posts that are due
    const posts = await ScheduledPost.find({
      status: "pending",
      scheduled_at: { $lte: new Date() },
    })
      .sort({ scheduled_at: 1 })
      .limit(5)
      .populate("user_id");

    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: "No posts to publish" }, { status: 200 });
    }

    const results = [];
    const processedTargets = new Set<string>();

    // 2. Process each post
    for (const post of posts) {
      // Since we populated user_id, it is now the User document
      // We need to cast it to access fields, or assume it's the user
      const user = post.user_id as unknown as IUser;

      if (!user) {
        await markFailed(post, "Usuario no encontrado");
        results.push({ id: post._id, status: "failed", reason: "User not found" });
        continue;
      }

      const target = (post.linkedin_target as string | null) || "profile";
      if (target !== "profile" && target !== "page") {
        await markFailed(post, "Destino de LinkedIn inválido");
        results.push({ id: post._id, status: "failed", reason: "Invalid target" });
        continue;
      }

      const queueKey =
        target === "profile"
          ? `profile:${user.linkedin_member_urn ?? ""}`
          : `page:${(post.linkedin_page_urn as string | null) ?? ""}`;

      if (queueKey && processedTargets.has(queueKey)) {
        results.push({ id: post._id, status: "skipped", reason: "queued" });
        continue;
      }

      let accessToken: string | null = null;
      let authorUrn: string | null = null;

      if (target === "profile") {
        if (
          !user.linkedin_access_token ||
          !user.linkedin_member_urn
        ) {
          await markFailed(post, "User not connected to LinkedIn");
          results.push({ id: post._id, status: "failed", reason: "No LinkedIn token" });
          continue;
        }

        if (user.linkedin_expires_at && Date.now() > user.linkedin_expires_at) {
          // Token expired, try to refresh
          if (!user.linkedin_refresh_token) {
            await markFailed(post, "LinkedIn token expired and no refresh token available");
            results.push({ id: post._id, status: "failed", reason: "Token expired, no refresh" });
            continue;
          }

          try {
            const refreshToken = decryptToken(user.linkedin_refresh_token);
            const refreshed = await refreshLinkedInAccessToken(refreshToken);
            
            if (refreshed.error || !refreshed.accessToken) {
               throw new Error(refreshed.error || "Failed to refresh token");
            }

            // Update user with new tokens
            const newExpiresAt = refreshed.expiresIn 
              ? Date.now() + refreshed.expiresIn * 1000 
              : undefined;
            
            let newRefreshTokenEncrypted = user.linkedin_refresh_token;
            let newRefreshTokenExpiresAt = user.linkedin_refresh_expires_at;

            if (refreshed.refreshToken) {
               newRefreshTokenEncrypted = encryptToken(refreshed.refreshToken);
               newRefreshTokenExpiresAt = refreshed.refreshTokenExpiresIn 
                 ? Date.now() + refreshed.refreshTokenExpiresIn * 1000
                 : undefined;
            }

            // We need to update the user document
            // Since `user` is a POJO from populate (or hydration), better use User model to update
            await User.findByIdAndUpdate(user._id, {
               linkedin_access_token: refreshed.accessToken,
               linkedin_expires_at: newExpiresAt,
               linkedin_refresh_token: newRefreshTokenEncrypted,
               linkedin_refresh_expires_at: newRefreshTokenExpiresAt
            });

            // Use the new token
            accessToken = refreshed.accessToken;
            authorUrn = user.linkedin_member_urn;

          } catch (refreshError: unknown) {
             console.error("Error refreshing personal token:", refreshError);
             const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError);
             await markFailed(post, `LinkedIn token refresh failed: ${errorMessage}`);
             results.push({ id: post._id, status: "failed", reason: "Token refresh failed" });
             continue;
          }
        } else {
           accessToken = user.linkedin_access_token;
           authorUrn = user.linkedin_member_urn;
        }
      } else {
        const requestedPageUrn = (post.linkedin_page_urn as string | null) || null;
        try {
          // ensureValidLinkedInPageToken uses Mongoose internally now (refactored)
          // We pass user._id (which is the string ID or ObjectId)
          const result = await ensureValidLinkedInPageToken({
            userId: user._id.toString(),
            pageUrn: requestedPageUrn,
          });
          accessToken = result.accessToken;
          authorUrn = result.pageUrn;

          // Double check urn match if requested
          if (requestedPageUrn && authorUrn !== requestedPageUrn) {
            await markFailed(post, "LinkedIn page token mismatch");
            results.push({ id: post._id, status: "failed", reason: "Page token mismatch" });
            continue;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error de autenticación de página";
          await markFailed(post, message);
          results.push({ id: post._id, status: "failed", reason: message });
          continue;
        }
      }

      if (!accessToken || !authorUrn) {
        await markFailed(post, "No se pudo resolver el destino de LinkedIn");
        results.push({ id: post._id, status: "failed", reason: "No destination" });
        continue;
      }

      let media:
        | {
            buffer: Buffer;
            type: string;
            name?: string;
          }
        | Array<{
            buffer: Buffer;
            type: string;
            name?: string;
          }>
        | undefined = undefined;

      try {
        if (post.media_base64 && post.media_type) {
          const mediaType = post.media_type as string;
          const lowerType = mediaType.toLowerCase();
          const isImage = lowerType === "image" || lowerType.startsWith("image/");

          if (isImage) {
            try {
              const parsed = JSON.parse(post.media_base64) as unknown;
              if (Array.isArray(parsed) && parsed.length > 0) {
                const mediaItems = parsed
                  .map((item, index) => {
                    if (typeof item === "string") {
                      return {
                        buffer: Buffer.from(item, "base64") as Buffer,
                        type: mediaType,
                        name: (post.media_name as string | undefined) || `Imagen ${index + 1}`,
                      };
                    }

                    if (typeof item === "object" && item !== null) {
                      const maybe = item as { base64?: unknown; name?: unknown; mime?: unknown };
                      const base64 = typeof maybe.base64 === "string" ? maybe.base64 : null;
                      if (!base64) return null;
                      return {
                        buffer: Buffer.from(base64, "base64") as Buffer,
                        type: typeof maybe.mime === "string" ? maybe.mime : mediaType,
                        name:
                          typeof maybe.name === "string"
                            ? maybe.name
                            : ((post.media_name as string | undefined) || `Imagen ${index + 1}`),
                      };
                    }

                    return null;
                  })
                  .filter(
                    (m): m is { buffer: Buffer; type: string; name: string } => m !== null
                  );
                
                if (mediaItems.length > 0) {
                    media = mediaItems;
                }
              } else {
                media = {
                  buffer: Buffer.from(post.media_base64, "base64") as Buffer,
                  type: mediaType,
                  name: post.media_name as string | undefined,
                };
              }
            } catch {
              media = {
                buffer: Buffer.from(post.media_base64, "base64") as Buffer,
                type: mediaType,
                name: post.media_name as string | undefined,
              };
            }
          } else {
            media = {
              buffer: Buffer.from(post.media_base64, "base64") as Buffer,
              type: mediaType,
              name: post.media_name as string | undefined,
            };
          }
        }

        // Publish
        let response: { id: string } | undefined;
        try {
          response = await publishToLinkedIn(
            accessToken,
            authorUrn,
            post.content,
            "PUBLIC", // Default visibility
            media
          );
        } catch (err: unknown) {
          if (
            err instanceof LinkedInApiError &&
            (err.status === 401 || err.status === 403) &&
            target === "page"
          ) {
            try {
               const requestedPageUrn = (post.linkedin_page_urn as string | null) || null;
               // No Supabase client needed here anymore, just forceRefresh: true
               const { accessToken: newToken } = await ensureValidLinkedInPageToken({
                  userId: user._id.toString(),
                  pageUrn: requestedPageUrn,
                  forceRefresh: true
               });
               response = await publishToLinkedIn(
                 newToken,
                 authorUrn,
                 post.content,
                 "PUBLIC",
                 media
               );
            } catch (retryError) {
               console.error("Retry failed:", retryError);
               throw err;
            }
          } else {
            throw err;
          }
        }

        if (response) {
            // Update status to published
            post.status = "published";
            post.linkedin_post_id = response.id;
            post.error_message = undefined; // Clear error message if any
            post.published_at = new Date();
            await post.save();

            results.push({ id: post._id, status: "published", linkedinId: response.id });
            if (queueKey) processedTargets.add(queueKey);
        }

      } catch (err: unknown) {
        console.error("Error publishing post:", err);
        const message = err instanceof Error ? err.message : "Error desconocido al publicar";
        
        await markFailed(post, message);
        results.push({ id: post._id, status: "failed", reason: message });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error in cron job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function markFailed(post: HydratedDocument<IScheduledPost>, message: string) {
  post.status = "failed";
  post.error_message = message;
  post.failed_at = new Date();
  await post.save();
}
