import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }


    
    await dbConnect();
    
    const user = await User.findById(session.user.id).select(
      "name email image linkedin_access_token linkedin_member_urn linkedin_name linkedin_headline linkedin_picture linkedin_expires_at"
    );

    if (user && user.linkedin_access_token) {
      return NextResponse.json(
        {
          connected: true,
          user: {
            name: user.linkedin_name || user.name,
            picture: user.linkedin_picture || user.image,
            email: user.email,
            headline: user.linkedin_headline,
            memberUrn: user.linkedin_member_urn,
            expiresAt: user.linkedin_expires_at ?? undefined,
          },
          debug: {
            hasLinkedinPicture: !!user.linkedin_picture,
            linkedinPictureVal: user.linkedin_picture,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ connected: false }, { status: 200 });
  } catch (error) {
    console.error("Error fetching LinkedIn session:", error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
