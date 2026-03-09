import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import VoiceProfile from "@/models/VoiceProfile";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    await dbConnect();
    const profiles = await VoiceProfile.find({ user_id: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    
    const transformedProfiles = profiles.map(profile => ({
      ...profile,
      id: profile._id.toString(),
      user_id: profile.user_id.toString(),
      style_tag: profile.selected_tag, 
      _id: undefined, 
    }));

    return NextResponse.json(transformedProfiles, { status: 200 });
  } catch (error) {
    console.error("Error fetching voice profiles:", error);
    return NextResponse.json(
      { error: "Error al obtener perfiles de voz" },
      { status: 500 }
    );
  }
}
