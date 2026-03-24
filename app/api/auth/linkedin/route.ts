import crypto from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const scope = ["openid", "profile", "email", "w_member_social"].join(" ");
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "";
  const responseHeaders = {
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Cache-Control": "no-store",
  };

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Faltan variables de entorno de LinkedIn" },
      { status: 500, headers: responseHeaders },
    );
  }

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(redirectUri);
  } catch {
    return NextResponse.json(
      { error: "LINKEDIN_REDIRECT_URI inválido" },
      { status: 500, headers: responseHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && redirectUrl.protocol !== "https:") {
    return NextResponse.json(
      { error: "LINKEDIN_REDIRECT_URI debe usar https" },
      { status: 500, headers: responseHeaders },
    );
  }

  if (baseUrl) {
    let baseUrlParsed: URL;
    try {
      baseUrlParsed = new URL(baseUrl);
    } catch {
      return NextResponse.json(
        { error: "APP_URL inválido" },
        { status: 500, headers: responseHeaders },
      );
    }
    if (redirectUrl.host !== baseUrlParsed.host) {
      return NextResponse.json(
        { error: "LINKEDIN_REDIRECT_URI no coincide con APP_URL" },
        { status: 500, headers: responseHeaders },
      );
    }
  }

  const state = crypto.randomUUID();

  const authorizeUrl = new URL(
    "https://www.linkedin.com/oauth/v2/authorization",
  );
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUrl.toString());
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.headers.set("X-Robots-Tag", responseHeaders["X-Robots-Tag"]);
  response.headers.set("Cache-Control", responseHeaders["Cache-Control"]);
  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return response;
}
