import NextAuth from "next-auth";
import authConfig from "./auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
