import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Testimonial from "@/models/Testimonial";
import User from "@/models/User";
import { auth } from "@/auth";
import type {
  TestimonialCreateRequest,
  TestimonialCreateResponse,
  TestimonialListResponse,
} from "@/types/testimonial";

export async function GET() {
  try {
    await dbConnect();
    const items = await Testimonial.find()
      .sort({ createdAt: -1 })
      .limit(9)
      .lean();

    const response: TestimonialListResponse = {
      items: items.map((item) => ({
        id: item._id.toString(),
        userId: typeof item.user_id === "string" ? item.user_id : undefined,
        name: item.name,
        image: item.image ?? undefined,
        role: item.role ?? undefined,
        company: item.company ?? undefined,
        content: item.content,
        rating: item.rating ?? undefined,
        createdAt: item.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los testimonios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | TestimonialCreateRequest
    | null;

  if (!body) {
    return NextResponse.json(
      { error: "Datos inválidos" },
      { status: 400 }
    );
  }

  const content = body.content?.trim();
  const rating = body.rating;

  if (!content || content.length < 10) {
    return NextResponse.json(
      { error: "Testimonio inválido" },
      { status: 400 }
    );
  }

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return NextResponse.json(
      { error: "Calificación inválida" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const user = await User.findById(session.user.id)
      .select("name image linkedin_picture createdAt testimonial_done")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.testimonial_done === true) {
      return NextResponse.json(
        { error: "Testimonio ya registrado" },
        { status: 409 }
      );
    }

    const existing = await Testimonial.findOne({ user_id: session.user.id })
      .select("_id")
      .lean();

    if (existing) {
      await User.updateOne(
        { _id: session.user.id },
        { $set: { testimonial_done: true } }
      );
      return NextResponse.json(
        { error: "Testimonio ya registrado" },
        { status: 409 }
      );
    }

    const createdAtTime = user.createdAt
      ? new Date(user.createdAt).getTime()
      : Date.now();
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    if (Date.now() - createdAtTime < twoDaysMs) {
      return NextResponse.json(
        { error: "Aún no cumple los 2 días de registro" },
        { status: 403 }
      );
    }

    const name =
      (typeof user.name === "string" ? user.name.trim() : "") ||
      (typeof session.user.name === "string" ? session.user.name.trim() : "");
    const linkedInPicture =
      typeof user.linkedin_picture === "string" ? user.linkedin_picture : "";
    const image =
      (typeof user.image === "string" && user.image.trim()) ||
      linkedInPicture.trim() ||
      (typeof session.user.image === "string" ? session.user.image.trim() : "");

    if (!name) {
      return NextResponse.json(
        { error: "Nombre inválido" },
        { status: 400 }
      );
    }

    const created = await Testimonial.create({
      user_id: session.user.id,
      name,
      image: image || undefined,
      content,
      rating: rating ?? undefined,
    });

    await User.updateOne(
      { _id: session.user.id },
      { $set: { testimonial_done: true } }
    );

    const response: TestimonialCreateResponse = {
      item: {
        id: created._id.toString(),
        userId: typeof created.user_id === "string" ? created.user_id : undefined,
        name: created.name,
        image: created.image ?? undefined,
        role: created.role ?? undefined,
        company: created.company ?? undefined,
        content: created.content,
        rating: created.rating ?? undefined,
        createdAt: created.createdAt.toISOString(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el testimonio" },
      { status: 500 }
    );
  }
}
