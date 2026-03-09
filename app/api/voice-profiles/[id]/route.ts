import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import VoiceProfile from "@/models/VoiceProfile";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();
    const profile = await VoiceProfile.findOne({
      _id: id,
      user_id: session.user.id,
    }).lean();

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado o no autorizado" },
        { status: 404 }
      );
    }

    const transformedProfile = {
      ...profile,
      id: profile._id.toString(),
      user_id: profile.user_id.toString(),
      style_tag: profile.selected_tag,
      _id: undefined,
    };

    return NextResponse.json(transformedProfile, { status: 200 });
  } catch (error) {
    console.error("Error fetching voice profile:", error);
    return NextResponse.json(
      { error: "Perfil no encontrado o no autorizado" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();
    const result = await VoiceProfile.deleteOne({
      _id: id,
      user_id: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Error al eliminar el perfil" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Perfil eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting voice profile:", error);
    return NextResponse.json(
      { error: "Error al eliminar el perfil" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { context, examples } = body;

  if (context === undefined && examples === undefined) {
    return NextResponse.json(
      { error: "No se proporcionaron datos para actualizar" },
      { status: 400 }
    );
  }

  const { id } = await params;

  try {
    await dbConnect();

    const updateData: { context?: string; examples?: string[] } = {};
    if (context !== undefined) updateData.context = context;
    if (examples !== undefined) updateData.examples = examples;

    const updatedProfile = await VoiceProfile.findOneAndUpdate(
      { _id: id, user_id: session.user.id },
      updateData,
      { returnDocument: "after" }
    ).lean();

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "Error al actualizar el perfil" },
        { status: 500 }
      );
    }

    const transformedProfile = {
      ...updatedProfile,
      id: updatedProfile._id.toString(),
      user_id: updatedProfile.user_id.toString(),
      style_tag: updatedProfile.selected_tag,
      _id: undefined,
    };

    return NextResponse.json(transformedProfile, { status: 200 });
  } catch (error) {
    console.error("Error updating voice profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar el perfil" },
      { status: 500 }
    );
  }
}
