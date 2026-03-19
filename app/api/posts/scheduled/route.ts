import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    
    const posts = await ScheduledPost.find({ user_id: session.user.id })
      .sort({ scheduled_at: -1 })
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
      id: post._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json({ posts: formattedPosts }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching scheduled posts:", error);
    const message = error instanceof Error ? error.message : "Error al obtener posts programados";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
