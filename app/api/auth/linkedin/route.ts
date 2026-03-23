import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const scope = ["openid", "profile", "email", "w_member_social"].join(" ");
  const cookieDomain = process.env.COOKIE_DOMAIN;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Faltan variables de entorno de LinkedIn" },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();

  const authorizeUrl = new URL(
    "https://www.linkedin.com/oauth/v2/authorization",
  );
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
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
