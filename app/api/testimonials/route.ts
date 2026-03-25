import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Testimonial from "@/models/Testimonial";
import User from "@/models/User";
import { auth } from "@/auth";
import { readLinkedInPages } from "@/lib/linkedin";
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

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const isDataUrl = (value: string) => value.startsWith("data:");

const downloadImageAsDataUrl = async (url: string) => {
  if (!url) return null;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const contentType =
      response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) return null;
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
};

const resolveProfileSnapshot = async (
  user: {
    name?: string | null;
    image?: string | null;
    linkedin_name?: string | null;
    linkedin_picture?: string | null;
    linkedin_access_token?: string | null;
    linkedin_member_urn?: string | null;
    linkedin_page_access_token_encrypted?: string | null;
  },
  sessionName?: string | null,
  sessionImage?: string | null,
) => {
  const hasLinkedInProfile =
    typeof user.linkedin_access_token === "string" &&
    user.linkedin_access_token.trim().length > 0 &&
    typeof user.linkedin_member_urn === "string" &&
    user.linkedin_member_urn.trim().length > 0;

  const linkedInName =
    typeof user.linkedin_name === "string" ? user.linkedin_name.trim() : "";
  const linkedInPicture =
    typeof user.linkedin_picture === "string"
      ? user.linkedin_picture.trim()
      : "";

  const pages = readLinkedInPages(
    user.linkedin_page_access_token_encrypted,
    null,
  );
  const pageEntry = [...pages].reverse().find((entry) => entry.name || entry.logoUrl) || null;
  const pageName = pageEntry?.name?.trim() ?? "";
  const pageLogo = pageEntry?.logoUrl?.trim() ?? "";

  const fallbackName =
    (typeof user.name === "string" ? user.name.trim() : "") ||
    (typeof sessionName === "string" ? sessionName.trim() : "");
  const fallbackImage =
    (typeof user.image === "string" ? user.image.trim() : "") ||
    (typeof sessionImage === "string" ? sessionImage.trim() : "");

  const name = hasLinkedInProfile && linkedInName
    ? linkedInName
    : pageName || fallbackName;

  const imageSource = hasLinkedInProfile && linkedInPicture
    ? linkedInPicture
    : pageLogo || fallbackImage;

  let imageSnapshot: string | null = null;
  if (imageSource) {
    imageSnapshot = isDataUrl(imageSource)
      ? imageSource
      : await downloadImageAsDataUrl(imageSource);
  }

  return {
    name,
    image: imageSnapshot,
  };
};

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
      .select(
        "name image linkedin_name linkedin_picture linkedin_access_token linkedin_member_urn linkedin_page_access_token_encrypted createdAt testimonial_done",
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const existing = await Testimonial.findOne({ user_id: session.user.id })
      .select("_id")
      .lean();

    if (existing) {
      const profileSnapshot = await resolveProfileSnapshot(
        user,
        session.user.name ?? null,
        session.user.image ?? null,
      );

      if (!profileSnapshot.name) {
        return NextResponse.json(
          { error: "Nombre inválido" },
          { status: 400 }
        );
      }

      const updated = await Testimonial.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            name: profileSnapshot.name,
            image: profileSnapshot.image || undefined,
            content,
            rating: rating ?? undefined,
          },
        },
        { returnDocument: "after" }
      ).lean();

      await User.updateOne(
        { _id: session.user.id },
        { $set: { testimonial_done: true } }
      );
      const response: TestimonialCreateResponse = {
        item: {
          id: updated?._id.toString() || existing._id.toString(),
          userId: typeof session.user.id === "string" ? session.user.id : undefined,
          name: updated?.name || profileSnapshot.name,
          image: updated?.image ?? profileSnapshot.image ?? undefined,
          role: updated?.role ?? undefined,
          company: updated?.company ?? undefined,
          content: updated?.content ?? content,
          rating: updated?.rating ?? rating ?? undefined,
          createdAt: updated?.createdAt
            ? updated.createdAt.toISOString()
            : new Date().toISOString(),
        },
      };
      return NextResponse.json(response, { status: 200 });
    }

    if (user.testimonial_done === true) {
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

    const profileSnapshot = await resolveProfileSnapshot(
      user,
      session.user.name ?? null,
      session.user.image ?? null,
    );

    if (!profileSnapshot.name) {
      return NextResponse.json(
        { error: "Nombre inválido" },
        { status: 400 }
      );
    }

    const created = await Testimonial.create({
      user_id: session.user.id,
      name: profileSnapshot.name,
      image: profileSnapshot.image || undefined,
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
