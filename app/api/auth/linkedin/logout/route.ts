import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await dbConnect();

  await User.findByIdAndUpdate(session.user.id, {
    linkedin_access_token: null,
    linkedin_expires_at: null,
    linkedin_refresh_token: null,
    linkedin_refresh_expires_at: null,
  });

  const response = NextResponse.json({ success: true }, { status: 200 });

  
  response.cookies.delete("linkedin_session");
  
  
  response.cookies.delete("linkedin_oauth_state");

  return response;
}
