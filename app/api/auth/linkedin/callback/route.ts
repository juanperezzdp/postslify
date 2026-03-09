import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { LinkedInSession } from "@/types/linkedin";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { encryptToken } from "@/lib/linkedin";

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Faltan variables de entorno de LinkedIn" },
      { status: 500 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (error) {
    const response = NextResponse.json(
      {
        error: "Error en la autorización de LinkedIn",
        details: errorDescription || error,
      },
      { status: 400 },
    );
    response.cookies.delete("linkedin_oauth_state");
    return response;
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Código o estado inválido en la respuesta de LinkedIn" },
      { status: 400 },
    );
  }

  const stateCookie = request.cookies.get("linkedin_oauth_state")?.value;

  if (!stateCookie || stateCookie !== state) {
    return NextResponse.json(
      { error: "El estado de la sesión de LinkedIn no es válido" },
      { status: 400 },
    );
  }

  const tokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    },
  );

  if (!tokenResponse.ok) {
    return NextResponse.json(
      { error: "No se pudo obtener el token de acceso de LinkedIn" },
      { status: 500 },
    );
  }

  const tokenJson = (await tokenResponse.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    id_token?: string;
  };

  type LinkedInIdTokenPayload = {
    picture?: string;
  };
  type LinkedInMeResponse = {
    localizedHeadline?: string;
    profilePicture?: {
      "displayImage~"?: {
        elements?: Array<{
          identifiers?: Array<{
            identifier?: string;
          }>;
        }>;
      };
    };
  };

  const accessToken = tokenJson.access_token;
  const expiresIn = tokenJson.expires_in;
  let idTokenPayload: LinkedInIdTokenPayload | null = null;

  if (tokenJson.id_token) {
    try {
      const parts = tokenJson.id_token.split(".");
      if (parts.length === 3) {
        idTokenPayload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString(),
        ) as LinkedInIdTokenPayload;
      }
    } catch (e) {
      console.error("Error decoding id_token:", e);
    }
  }

  const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    return NextResponse.json(
      { error: "No se pudo obtener el perfil de LinkedIn" },
      { status: 500 },
    );
  }

  const profileJson = (await profileResponse.json()) as {
    sub: string;
    name?: string;
    picture?: string;
    email?: string;
  };

  let headline = "";
  let pictureUrl = idTokenPayload?.picture || profileJson.picture;

  try {
    const meResponse = await fetch(
      "https://api.linkedin.com/v2/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (meResponse.ok) {
      const meJson = (await meResponse.json()) as LinkedInMeResponse;

      if (meJson.localizedHeadline) {
        headline = meJson.localizedHeadline;
      }

      if (
        !pictureUrl &&
        meJson.profilePicture &&
        meJson.profilePicture["displayImage~"]?.elements
      ) {
        const elements = meJson.profilePicture["displayImage~"].elements;
        if (elements.length > 0) {
          const lastElement = elements[elements.length - 1];
          if (lastElement.identifiers && lastElement.identifiers.length > 0) {
            pictureUrl = lastElement.identifiers[0].identifier;
          }
        }
      }
    } else {
      console.error(
        "LinkedIn meResponse not ok:",
        meResponse.status,
        await meResponse.text()
      );
    }
  } catch (error) {
    console.error("Error fetching LinkedIn extra info:", error);
  }

  const memberUrn = `urn:li:person:${profileJson.sub}`;
  const expiresAt = Date.now() + expiresIn * 1000;

  const session: LinkedInSession = {
    accessToken,
    expiresAt,
    memberUrn,
    name: profileJson.name,
    picture: pictureUrl,
    email: profileJson.email,
    headline,
  };

  const sessionValue = Buffer.from(JSON.stringify(session)).toString(
    "base64url",
  );

  const authSession = await auth();
  let targetPath = "/";

  if (authSession?.user?.id) {
    let encryptedRefreshToken = undefined;
    if (tokenJson.refresh_token) {
      try {
        encryptedRefreshToken = encryptToken(tokenJson.refresh_token);
      } catch (e) {
        console.error("Error encrypting refresh token:", e);
      }
    }

    const refreshTokenExpiresAt = tokenJson.refresh_token_expires_in
      ? Date.now() + tokenJson.refresh_token_expires_in * 1000
      : undefined;

    await dbConnect();
    await User.findByIdAndUpdate(authSession.user.id, {
      linkedin_access_token: accessToken,
      linkedin_member_urn: memberUrn,
      linkedin_expires_at: expiresAt,
      linkedin_refresh_token: encryptedRefreshToken,
      linkedin_refresh_expires_at: refreshTokenExpiresAt,
      linkedin_name: profileJson.name,
      linkedin_headline: headline,
      linkedin_picture: pictureUrl,
    });
    targetPath = `/${authSession.user.id}/create-post`;
  }

  const redirectUrl = new URL(targetPath, request.url);
  const response = NextResponse.redirect(redirectUrl.toString());

  response.cookies.set("linkedin_session", sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });

  response.cookies.delete("linkedin_oauth_state");

  return response;
}
