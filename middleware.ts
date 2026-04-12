import NextAuth from "next-auth";
import authConfig from "./auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const host = (req.headers.get("host") || "").toLowerCase();
  const hostname = host.split(":")[0];
  const forwardedProto = (req.headers.get("x-forwarded-proto") || "https").toLowerCase();
  const pathname = req.nextUrl.pathname;

  const url = req.nextUrl.clone();
  
  if (
    hostname === "www.postslify.com" ||
    (hostname === "postslify.com" && forwardedProto !== "https")
  ) {
    url.protocol = "https:";
    url.hostname = "postslify.com";
    url.port = ""; 
    return NextResponse.redirect(url, 301);
  }

  // Quitar trailing slash si existe, excepto si es el root "/"
  if (pathname !== "/" && pathname.endsWith("/")) {
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\/[^/]+\.[^/]+$/.test(pathname);

  if (isStaticAsset) {
    return NextResponse.next();
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  const locale = pathSegments[0];
  const hasLocale = locale === "en" || locale === "es";
  const routeUserId = hasLocale ? pathSegments[1] : pathSegments[0];
  const routeSection = hasLocale ? pathSegments[2] : pathSegments[1];
  const protectedSections = new Set([
    "dashboard",
    "calendar",
    "create-post",
    "voice-profiles",
    "voice-profile",
    "billing",
    "settings",
    "business-page",
    "archived-posts",
  ]);
  const isProtectedRoute = Boolean(routeSection && protectedSections.has(routeSection));
  const sessionUserId = typeof req.auth?.user?.id === "string" ? req.auth.user.id : undefined;

  if (pathname === "/" || pathname === "/es" || pathname === "/en") {
    const safeLocale = hasLocale ? locale : "en";
    
    // Si la ruta es exactamente "/" o "/es" o "/en", lo forzamos a mostrarse limpio pero
    // aseguramos de que el middleware de internacionalización pueda hacer su trabajo si es necesario.
    // Dejaremos que next-intl maneje /es y /en en lugar de nosotros intervenir aquí, 
    // a menos que sea el root estricto "/".
    
    if (pathname === "/") {
      url.pathname = `/${safeLocale}`;
      return NextResponse.redirect(url, 301);
    }
  }

  if (isProtectedRoute && !req.auth?.user) {
    const loginPath = hasLocale ? `/${locale}/login` : "/login";
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = loginPath;
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedRoute && sessionUserId && routeUserId && routeUserId !== sessionUserId) {
    const safeLocale = hasLocale ? locale : "en";
    const ownUrl = req.nextUrl.clone();
    ownUrl.pathname = `/${safeLocale}/${sessionUserId}/create-post`;
    ownUrl.search = "";
    return NextResponse.redirect(ownUrl);
  }

  const response = intlMiddleware(req);

  if (isProtectedRoute) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
});

export const config = {
  matcher: ["/:path*"],
};
