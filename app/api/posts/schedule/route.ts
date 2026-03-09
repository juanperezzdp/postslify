import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { readLinkedInPages, resolveLinkedInPageAccess } from "@/lib/linkedin";
import type { LinkedInSession } from "@/types/linkedin";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ScheduledPost from "@/models/ScheduledPost";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const {
    content,
    media,
    scheduledAt,
    timezone,
    voiceProfile,
    target,
    pageUrn,
    targetName,
    targetImage,
  } = body;

  if (!content) {
    return NextResponse.json(
      { error: "El contenido es obligatorio" },
      { status: 400 }
    );
  }

  if (!scheduledAt || !timezone) {
    return NextResponse.json(
      { error: "Fecha y zona horaria son obligatorias" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const linkedinTarget = target === "page" ? "page" : "profile";

    
    const user = await User.findById(session.user.id).select(
      "name image linkedin_access_token linkedin_member_urn linkedin_name linkedin_headline linkedin_picture linkedin_expires_at linkedin_page_access_token_encrypted"
    );

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (linkedinTarget === "profile") {
      if (!user.linkedin_access_token || !user.linkedin_member_urn) {
        return NextResponse.json(
          { error: "Conecta tu perfil de LinkedIn antes de programar." },
          { status: 401 }
        );
      }

      if (user.linkedin_expires_at && Date.now() > user.linkedin_expires_at) {
        return NextResponse.json(
          { error: "La sesión de LinkedIn ha expirado" },
          { status: 401 }
        );
      }
    }

    const requestedPageUrn = typeof pageUrn === "string" ? pageUrn : null;
    let pageEntryName: string | null = null;
    let pageEntryLogo: string | null = null;
    if (linkedinTarget === "page") {
      
      if (!user.linkedin_page_access_token_encrypted) {
        return NextResponse.json(
          { error: "Configura el token de tu página de LinkedIn antes de programar." },
          { status: 400 }
        );
      }

      const resolved = resolveLinkedInPageAccess({
        encryptedPayload: user.linkedin_page_access_token_encrypted,
        requestedPageUrn,
      });

      if (!resolved.accessToken || !resolved.pageUrn) {
        return NextResponse.json(
          { error: "Configura el token de tu página de LinkedIn antes de programar." },
          { status: 400 }
        );
      }

      if (requestedPageUrn && resolved.pageUrn !== requestedPageUrn) {
        return NextResponse.json(
          { error: "El token no corresponde a la página seleccionada." },
          { status: 400 }
        );
      }

      const pages = readLinkedInPages(user.linkedin_page_access_token_encrypted, requestedPageUrn);
      const entry = pages.find((page) => page.pageUrn === requestedPageUrn) || pages[0] || null;
      pageEntryName = entry?.name ?? null;
      pageEntryLogo = entry?.logoUrl ?? null;
    }

    
    
    
    let mediaBase64 = null;
    let mediaType = null;
    let mediaName = null;

    if (media && Array.isArray(media) && media.length > 0) {
        
        
        
        
        
        mediaBase64 = JSON.stringify(media);
        mediaType = media[0]?.type || "image/jpeg"; 
        
        
        
    } else if (media && typeof media === 'object') {
        mediaBase64 = media.base64;
        mediaType = media.type;
        mediaName = media.name;
    }

    
    let sessionName: string | null = null;
    let sessionImage: string | null = null;
    if (linkedinTarget === "profile") {
      const sessionCookie = request.cookies.get("linkedin_session")?.value;
      if (sessionCookie) {
        try {
          const decoded = Buffer.from(sessionCookie, "base64url").toString("utf8");
          const sessionData = JSON.parse(decoded) as LinkedInSession;
          if (Date.now() <= sessionData.expiresAt) {
            sessionName = sessionData.name ?? null;
            sessionImage = sessionData.picture ?? null;
          }
        } catch {
          sessionName = null;
          sessionImage = null;
        }
      }
    }

    const resolvedTargetName =
      typeof targetName === "string" && targetName.trim().length > 0
        ? targetName.trim()
        : linkedinTarget === "profile"
          ? sessionName || user.linkedin_name || user.name || null
          : pageEntryName
            ? pageEntryName
          : null;
    const resolvedTargetImage =
      typeof targetImage === "string" && targetImage.trim().length > 0
        ? targetImage.trim()
        : linkedinTarget === "profile"
          ? sessionImage || user.linkedin_picture || user.image || null
          : pageEntryLogo
            ? pageEntryLogo
          : null;

    const postData = {
      user_id: session.user.id,
      content,
      scheduled_at: new Date(scheduledAt),
      timezone,
      voice_profile_name: voiceProfile?.name,
      voice_profile_emoji: voiceProfile?.emoji,
      voice_profile_style: voiceProfile?.style,
      linkedin_target: linkedinTarget,
      linkedin_page_urn: target === "page" ? pageUrn : undefined,
      linkedin_target_name: resolvedTargetName,
      linkedin_target_image: resolvedTargetImage,
      status: "pending",
      media_base64: mediaBase64,
      media_type: mediaType,
      media_name: mediaName,
    };

    const newPost = await ScheduledPost.create(postData);

    
    return NextResponse.json({
      success: true,
      post: {
        ...newPost.toObject(),
        id: newPost._id.toString(),
        _id: newPost._id.toString(),
      }
    });

  } catch (error: unknown) {
    console.error("Error creating scheduled post:", error);
    return NextResponse.json(
      { error: "Error interno al programar el post" },
      { status: 500 }
    );
  }
}
