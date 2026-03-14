import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const pathSegments = nextUrl.pathname.split("/").filter(Boolean);
      const locales = ["en", "es"];
      const hasLocale = locales.includes(pathSegments[0]);

      
      
      let pageSegment;
      if (hasLocale) {
        
        if (pathSegments.length > 2) pageSegment = pathSegments[2];
      } else {
        
        if (pathSegments.length > 1) pageSegment = pathSegments[1];
      }

      const protectedRoutes = [
        "dashboard",
        "calendar",
        "create-post",
        "voice-profiles",
        "voice-profile",
        "billing",
        "settings",
        "business-page",
        "archived-posts",
      ];
      
      const isProtectedRoute =
        pageSegment && protectedRoutes.includes(pageSegment);

      if (isProtectedRoute) {
        if (isLoggedIn) {
          return true;
        }
        return false;
      } else if (isLoggedIn && (nextUrl.pathname === "/" || nextUrl.pathname === "/login" || (hasLocale && (nextUrl.pathname === `/${pathSegments[0]}` || nextUrl.pathname === `/${pathSegments[0]}/login`)))) {
        const userId = (auth.user as { id?: string }).id;
        if (userId) {
             const localePrefix = hasLocale ? `/${pathSegments[0]}` : '';
             return Response.redirect(new URL(`${localePrefix}/${userId}/create-post`, nextUrl));
        }
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
