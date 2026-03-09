import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import VoiceProfile from "@/models/VoiceProfile";
import type { VoiceProfilePayload } from "@/types/voice-profile";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No hay sesión activa" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | VoiceProfilePayload
    | null;

  if (!body) {
    return NextResponse.json(
      { error: "El cuerpo de la petición es obligatorio" },
      { status: 400 },
    );
  }

  const voiceName = body.voiceName?.trim();

  if (!voiceName) {
    return NextResponse.json(
      { error: "El nombre de la voz es obligatorio" },
      { status: 400 },
    );
  }

  const timezone = body.timezone?.trim();
  const language = body.language?.trim();
  const context = body.context?.trim();
  const examples = Array.isArray(body.examples) ? body.examples : [];
  const selectedTag = body.selectedTag?.trim();
  const styleEmoji = body.styleEmoji?.trim();

  if (!timezone) {
    return NextResponse.json(
      { error: "La zona horaria es obligatoria" },
      { status: 400 },
    );
  }

  if (!context) {
    return NextResponse.json(
      { error: "El contexto es obligatorio" },
      { status: 400 },
    );
  }

  if (!selectedTag) {
    return NextResponse.json(
      { error: "El estilo de la voz es obligatorio" },
      { status: 400 },
    );
  }

  try {
    await dbConnect();

    
    const count = await VoiceProfile.countDocuments({
      user_id: session.user.id,
    });

    
    if (count >= 30) {
      return NextResponse.json(
        { error: "Has alcanzado el límite de 30 perfiles de voz" },
        { status: 403 }
      );
    }

    
    const existingProfile = await VoiceProfile.findOne({
      user_id: session.user.id,
      voice_name: voiceName,
    });

    if (existingProfile) {
      return NextResponse.json(
        {
          error: "Ya existe un perfil con este nombre. Por favor elige otro.",
        },
        { status: 409 }
      );
    }

    
    const newProfile = await VoiceProfile.create({
      user_id: session.user.id,
      voice_name: voiceName,
      timezone,
      language: language || "es", 
      context,
      examples,
      selected_tag: selectedTag,
      style_emoji: styleEmoji,
    });

    
    
    const responseData = {
      id: newProfile._id.toString(),
      user_id: newProfile.user_id.toString(),
      voice_name: newProfile.voice_name,
      timezone: newProfile.timezone,
      language: newProfile.language,
      context: newProfile.context,
      examples: newProfile.examples,
      selected_tag: newProfile.selected_tag,
      style_emoji: newProfile.style_emoji,
      created_at: newProfile.createdAt,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Error creating voice profile:", error);
    return NextResponse.json(
      { error: "Error al crear el perfil de voz" },
      { status: 500 }
    );
  }
}
