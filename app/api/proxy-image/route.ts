import { NextRequest, NextResponse } from "next/server";
import { PROXY_CONFIG } from "@/lib/security";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);
    const isAllowed = PROXY_CONFIG.allowedDomains.some((domain) =>
      parsedUrl.hostname.endsWith(domain)
    );

    if (!isAllowed) {
      console.warn(`Blocked proxy request for domain: ${parsedUrl.hostname}`);
      return new NextResponse("Forbidden: Domain not allowed", { status: 403 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
