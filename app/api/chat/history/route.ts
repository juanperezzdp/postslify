import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import ChatHistory from "@/models/ChatHistory";
import type { Message } from "@/types/posts";
import type { ChatHistoryListResponse, ChatHistoryUpdateRequest } from "@/types/chat-history";

type MediaPayload = Message["media"];

const normalizeMedia = (media: MediaPayload): MediaPayload => {
  if (!media || media.type !== "image") return media;
  const items =
    media.items && media.items.length > 0
      ? media.items
      : media.url
        ? [{ url: media.url, name: media.name }]
        : [];
  if (items.length === 0) return media;
  const [primaryItem] = items;
  return {
    ...media,
    url: media.url || primaryItem.url,
    name: media.name || primaryItem.name,
    items,
  };
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await dbConnect();
    const url = new URL(request.url);
    const rawLimit = url.searchParams.get("limit");
    const rawCursor = url.searchParams.get("cursor");
    const rawArchived = url.searchParams.get("archived");
    
    const limitValue = rawLimit ? Number(rawLimit) : 10;
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 50) : 10;
    const cursorDate = rawCursor ? new Date(rawCursor) : null;
    const isArchived = rawArchived === "true";

    const filter: {
      user_id: string;
      archived?: boolean;
      createdAt?: { $lt: Date };
      $or?: Array<{ archived: boolean } | { archived: { $exists: false } }>;
    } = {
      user_id: session.user.id,
      ...(isArchived
        ? { archived: true }
        : { $or: [{ archived: false }, { archived: { $exists: false } }] }),
    };

    if (cursorDate && !Number.isNaN(cursorDate.getTime())) {
      filter.createdAt = { $lt: cursorDate };
    }

    const rows = await ChatHistory.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const pageItems = hasMore ? rows.slice(0, limit) : rows;
    const orderedItems = [...pageItems].reverse();
    const nextCursor = orderedItems[0]?.createdAt?.toISOString();

    const response: ChatHistoryListResponse = {
      items: orderedItems.map((row) => ({
        id: row._id.toString(),
        user_message: row.user_message,
        ai_response: row.ai_response,
        voice_profile: row.voice_profile,
        media: row.media,
        createdAt: row.createdAt.toISOString(),
      })),
      hasMore,
      nextCursor,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "No se pudo obtener el historial" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ChatHistoryUpdateRequest | null;
  const id = body?.id?.trim();
  const media = body?.media ?? undefined;
  const aiResponse = typeof body?.ai_response === "string" ? body.ai_response : undefined;

  if (!id || (media === undefined && aiResponse === undefined)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    await dbConnect();
    const updateSet: Partial<{ media: MediaPayload; ai_response: string }> = {};
    const updateUnset: Partial<{ media: string }> = {};
    if (media === null) {
      updateUnset.media = "";
    } else if (media !== undefined) {
      updateSet.media = normalizeMedia(media);
    }
    if (aiResponse !== undefined) {
      updateSet.ai_response = aiResponse;
    }

    const updatePayload: {
      $set?: Partial<{ media: MediaPayload; ai_response: string }>;
      $unset?: Partial<{ media: string }>;
    } = {};
    if (Object.keys(updateSet).length > 0) {
      updatePayload.$set = updateSet;
    }
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
    console.error("Error updating chat history:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el historial" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await dbConnect();
    const result = await ChatHistory.deleteOne({ _id: id, user_id: session.user.id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Historial no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting chat history:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el historial" },
      { status: 500 }
    );
  }
}
