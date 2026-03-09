"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { routing } from "@/i18n/routing";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");
    let redirectTo = `/${routing.defaultLocale}`;

    if (typeof email === "string") {
      await dbConnect();
      const user = await User.findOne({ email: email.toLowerCase() }).select("_id");
      if (user) {
        redirectTo = `/${routing.defaultLocale}/${user._id}/create-post`;
      }
    }

    await signIn("credentials", {
      email: typeof email === "string" ? email : "",
      password: typeof password === "string" ? password : "",
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas.";
        default:
          return "Algo salió mal.";
      }
    }
    throw error;
  }
}
