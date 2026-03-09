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
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        text?: string;
        target?: string;
      }
    | null;

  if (!body || !body.text || !body.text.trim()) {
    return NextResponse.json(
      { error: "El texto del post es obligatorio" },
      { status: 400 },
    );
  }

  const target = body.target || "profile";
  if (target !== "profile" && target !== "page") {
    return NextResponse.json(
      { error: "Destino inválido para publicación" },
      { status: 400 }
    );
  }

  let accessToken: string | null = null;
  let authorUrn: string | null = null;

  if (target === "profile") {
    const sessionCookie = request.cookies.get("linkedin_session")?.value;
    if (sessionCookie) {
      try {
        const decoded = Buffer.from(sessionCookie, "base64url").toString("utf8");
        const session = JSON.parse(decoded) as LinkedInSession;
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

  const text = body.text.trim();
  try {
    let postJson: { id: string };
    try {
      postJson = await publishToLinkedIn(accessToken, authorUrn, text, "PUBLIC");
    } catch (error: unknown) {
      if (
        error instanceof LinkedInApiError &&
        (error.status === 401 || error.status === 403) &&
        target === "page"
      ) {
         try {
           const { accessToken: newToken } = await ensureValidLinkedInPageToken({
             userId: authSession.user.id,
             forceRefresh: true,
           });
           postJson = await publishToLinkedIn(newToken, authorUrn, text, "PUBLIC");
         } catch (retryError) {
           console.error("Retry with force refresh failed:", retryError);
           throw error;
         }
      } else {
        throw error;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        result: postJson,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
