import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import ChatHistory from "@/models/ChatHistory";

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string; archived?: boolean } | null;
  const id = body?.id?.trim();
  const archived = body?.archived !== undefined ? body.archived : true;

  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await dbConnect();
    const updateSet: { archived: boolean; expiresAt?: Date } = { archived };
    const updateUnset: { expiresAt?: string } = {};
    if (archived) {
      updateUnset.expiresAt = "";
    } else {
      updateSet.expiresAt = new Date(Date.now() + SEVEN_DAYS_IN_MS);
    }
    const updatePayload: { $set: typeof updateSet; $unset?: typeof updateUnset } = {
      $set: updateSet,
    };
    if (Object.keys(updateUnset).length > 0) {
      updatePayload.$unset = updateUnset;
    }
    const updated = await ChatHistory.findOneAndUpdate(
      { _id: id, user_id: session.user.id },
      updatePayload,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Historial no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error archiving chat history:", error);
    return NextResponse.json(
      { error: "No se pudo archivar el historial" },
      { status: 500 }
    );
  }
}
