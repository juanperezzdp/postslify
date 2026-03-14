import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import { fromZonedTime } from "date-fns-tz";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    const post = await ScheduledPost.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.user_id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await ScheduledPost.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error deleting post:", error);
    const message = error instanceof Error ? error.message : "Error deleting post";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { scheduledAt, timezone } = body;

  if (!scheduledAt || !timezone) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const post = await ScheduledPost.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.user_id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    
    if (post.status === "published") {
      return NextResponse.json(
        { error: "Cannot reschedule a published post" },
        { status: 400 }
      );
    }

    // Convert local time to UTC
    const utcDate = fromZonedTime(scheduledAt, timezone);

    
    post.scheduled_at = utcDate;
    post.timezone = timezone;
    
    
    if (post.status === "failed") {
      post.status = "pending";
    }
    
    await post.save();

    return NextResponse.json({ success: true, post }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating post:", error);
    const message = error instanceof Error ? error.message : "Error updating post";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
