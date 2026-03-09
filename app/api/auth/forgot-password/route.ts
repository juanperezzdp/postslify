import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    
    const user = await User.findOne({ email });

    
    if (!user) {
      
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({ success: true });
    }

    
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600 * 1000); 

    
    user.reset_token = token;
    user.reset_token_expires = expires;
    await user.save();

    
    const emailResult = await sendPasswordResetEmail(user.email, token);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot password route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
