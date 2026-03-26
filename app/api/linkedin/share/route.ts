import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ensureValidLinkedInPageToken,
  LinkedInApiError,
  publishToLinkedIn,
} from "@/lib/linkedin";
import type { LinkedInSession } from "@/types/linkedin";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  let content = "";
  let visibility = "PUBLIC";
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
  let target = "profile";
  let requestedPageUrn: string | null = null;
  let accessToken: string | null = null;
  let authorUrn: string | null = null;
  let userId: string | null = null;

  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    userId = authSession.user.id;

    const formData = await request.formData();
    content = formData.get("content") as string;
    visibility = (formData.get("visibility") as string) || "PUBLIC";
    const files = formData.getAll("file").filter((f): f is File => f instanceof File);
    const mediaType = formData.get("mediaType") as string | null;
    target = (formData.get("target") as string | null) || "profile";
    const rawPageUrn = formData.get("pageUrn");
    requestedPageUrn =
      typeof rawPageUrn === "string" && rawPageUrn.trim() ? rawPageUrn.trim() : null;

    if (!content) {
      return NextResponse.json(
        { error: "El contenido del post es obligatorio" },
        { status: 400 }
      );
    }

    if (target !== "profile" && target !== "page") {
      return NextResponse.json(
        { error: "Destino inválido para publicación" },
        { status: 400 }
      );
    }

    if (files.length > 0 && mediaType) {
      if (mediaType === "image" && files.length > 1) {
        media = await Promise.all(
          files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            return {
              buffer: Buffer.from(arrayBuffer),
              type: file.type || mediaType,
              name: file.name,
            };
          })
        );
      } else {
        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        media = {
          buffer: Buffer.from(arrayBuffer),
          type: file.type || mediaType,
          name: file.name,
        };
      }
    }

    if (target === "profile") {
      const sessionCookie = request.cookies.get("linkedin_session")?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(
            Buffer.from(sessionCookie, "base64url").toString("utf8")
          ) as LinkedInSession;
          if (Date.now() <= session.expiresAt) {
            accessToken = session.accessToken;
            authorUrn = session.memberUrn;
          }
        } catch {
          accessToken = null;
          authorUrn = null;
        }
      }

      if (!accessToken || !authorUrn) {
        await dbConnect();
        const user = await User.findById(authSession.user.id).select(
          "linkedin_access_token linkedin_member_urn linkedin_expires_at"
        );

        if (!user?.linkedin_access_token || !user?.linkedin_member_urn) {
          return NextResponse.json(
            { error: "No estás conectado a LinkedIn" },
            { status: 401 }
          );
        }

        if (user.linkedin_expires_at && Date.now() > user.linkedin_expires_at) {
          return NextResponse.json(
            { error: "La sesión de LinkedIn ha expirado" },
            { status: 401 }
          );
        }

        accessToken = user.linkedin_access_token;
        authorUrn = user.linkedin_member_urn;
      }
    } else {
      try {
        const result = await ensureValidLinkedInPageToken({
          userId: authSession.user.id,
          pageUrn: requestedPageUrn,
        });
        accessToken = result.accessToken;
        authorUrn = result.pageUrn;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error de autenticación de página";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    if (!accessToken || !authorUrn) {
      return NextResponse.json(
        { error: "No se pudo resolver el destino de publicación" },
        { status: 400 }
      );
    }

    let publishResult;
    try {
      publishResult = await publishToLinkedIn(
        accessToken,
        authorUrn,
        content,
        visibility,
        media
      );
    } catch (error: unknown) {
      if (
        error instanceof LinkedInApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        if (target === "page" && userId) {
          try {
            const { accessToken: newToken } = await ensureValidLinkedInPageToken({
              userId,
              pageUrn: requestedPageUrn,
              forceRefresh: true,
            });
            publishResult = await publishToLinkedIn(
              newToken,
              authorUrn,
              content,
              visibility,
              media
            );
          } catch (retryError) {
            console.error("Retry with force refresh failed:", retryError);
            return NextResponse.json(
              { error: "La sesión de la página de LinkedIn ha expirado o ha sido revocada. Por favor, vuelve a conectar la página en la configuración." },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "La sesión de LinkedIn ha expirado o el acceso ha sido revocado. Por favor, vuelve a conectar tu cuenta en la configuración." },
            { status: 401 }
          );
        }
      } else {
        throw error;
      }
    }

    return NextResponse.json(
      {
        success: true,
        postId: publishResult.id,
        message: "Publicado exitosamente en LinkedIn",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Internal Server Error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
