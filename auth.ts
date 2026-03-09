import NextAuth from "next-auth";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
          return null;
        }

        try {
          await dbConnect();
          const user = await User.findOne({ email: normalizedEmail }).select(
            "+password_hash"
          );

          if (!user || !user.password_hash) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password_hash);

          if (!isValid) {
            return null;
          }

          const image =
            typeof user.image === "string" &&
            !user.image.startsWith("data:") &&
            user.image.length <= 2048
              ? user.image
              : undefined;

          return {
            id: user._id.toString(),
            name: user.name ?? user.email,
            email: user.email,
            image,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        const userEmail = (user as { email?: string }).email;
        if (typeof userEmail === "string") {
          token.email = userEmail.trim().toLowerCase();
        }
      }

      const tokenEmail =
        typeof token.email === "string"
          ? token.email.trim().toLowerCase()
          : undefined;

      
      if (tokenEmail && !token.id) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: tokenEmail }).select(
            "_id"
          );
          if (dbUser) {
            token.id = dbUser._id.toString();
          }
        } catch (error) {
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const tokenId = typeof token.id === "string" ? token.id : undefined;
        const tokenEmail =
          typeof token.email === "string"
            ? token.email.trim().toLowerCase()
            : undefined;

        if (tokenId) {
          (session.user as { id?: string }).id = tokenId;
        } else if (tokenEmail) {
          try {
            await dbConnect();
            const dbUser = await User.findOne({ email: tokenEmail }).select(
              "_id"
            );
            if (dbUser) {
              (session.user as { id?: string }).id = dbUser._id.toString();
            }
          } catch (error) {
          }
        }

        if (
          typeof session.user.image === "string" &&
          session.user.image.startsWith("data:")
        ) {
          session.user.image = undefined;
        }
      }
      return session;
    },
  },
});

export { auth, signIn, signOut };

export const GET = handlers.GET;
export const POST = handlers.POST;
