import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import type { UserSettingsFormValues } from "@/types/user-settings";

type UserSettingsUpdate = Partial<UserSettingsFormValues>;

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as UserSettingsUpdate;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";

  if (!name && !image) {
    return NextResponse.json(
      { error: "Datos inválidos" },
      { status: 400 }
    );
  }

  await dbConnect();

  const update: UserSettingsUpdate = {};
  if (name) update.name = name;
  if (image) update.image = image;

  const updatedUser = await User.findByIdAndUpdate(
    session.user.id,
    update,
    { new: true }
  ).select("name image");

  if (!updatedUser) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      name: updatedUser.name ?? "",
      image: updatedUser.image ?? "",
    },
    { status: 200 }
  );
}
