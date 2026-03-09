import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const targetUrl = new URL("/api/auth/linkedin/callback", request.url);
  targetUrl.search = request.nextUrl.search;
  return NextResponse.redirect(targetUrl.toString());
}
