import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import type { UserSettingsFormValues } from "@/types/user-settings";

type UserSettingsUpdate = Partial<UserSettingsFormValues> & { welcome_bonus_seen?: boolean };

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as UserSettingsUpdate;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const welcome_bonus_seen = typeof body.welcome_bonus_seen === "boolean" ? body.welcome_bonus_seen : undefined;

  if (!name && !image && welcome_bonus_seen === undefined) {
    return NextResponse.json(
      { error: "Datos inválidos" },
      { status: 400 }
    );
  }

  await dbConnect();

  const update: UserSettingsUpdate = {};
  if (name) update.name = name;
  if (image) update.image = image;
  if (welcome_bonus_seen !== undefined) update.welcome_bonus_seen = welcome_bonus_seen;

  const updatedUser = await User.findByIdAndUpdate(
    session.user.id,
    update,
    { returnDocument: "after" }
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
