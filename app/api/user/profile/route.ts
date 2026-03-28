import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Testimonial from "@/models/Testimonial";
import type { UserProfileResponse } from "@/types/user-profile";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await dbConnect();

  const user = await User.findById(session.user.id)
    .select("name image createdAt testimonial_done welcome_bonus_seen")
    .lean();

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const testimonialFlag =
    typeof user.testimonial_done === "boolean" ? user.testimonial_done : undefined;
  const hasTestimonial = Boolean(
    await Testimonial.exists({
      user_id: session.user.id,
    })
  );
  const finalFlag = testimonialFlag ?? hasTestimonial;

  if (testimonialFlag !== finalFlag) {
    await User.updateOne(
      { _id: session.user.id },
      { $set: { testimonial_done: finalFlag } }
    );
  }

  const response: UserProfileResponse & { welcomeBonusSeen?: boolean } = {
    id: session.user.id,
    name:
      (typeof user.name === "string" ? user.name.trim() : "") ||
      (typeof session.user.name === "string" ? session.user.name.trim() : ""),
    image:
      (typeof user.image === "string" ? user.image.trim() : "") ||
      (typeof session.user.image === "string" ? session.user.image.trim() : ""),
    createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    hasTestimonial: finalFlag,
    welcomeBonusSeen: user.welcome_bonus_seen ?? false,
  };

  return NextResponse.json(response, { status: 200 });
}
