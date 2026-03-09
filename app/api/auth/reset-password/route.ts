import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: "La contraseña debe incluir al menos una mayúscula, una minúscula y un número" },
        { status: 400 }
      );
    }

    await dbConnect();

    
    const user = await User.findOne({ reset_token: token });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    
    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      );
    }

    
    const passwordHash = await bcrypt.hash(password, 10);

    
    user.password_hash = passwordHash;
    user.reset_token = undefined;
    user.reset_token_expires = undefined;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reset password route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
