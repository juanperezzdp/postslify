import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import type { RegisterInputs } from "@/types/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | RegisterInputs
    | null;

  if (
    !body ||
    !body.email ||
    !body.password ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { error: "Email y contraseña son obligatorios y deben ser texto válido" },
      { status: 400 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;
  const name = body.name?.trim() || undefined;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son obligatorios" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 },
    );
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password)) {
    return NextResponse.json(
      {
        error:
          "La contraseña debe incluir minúsculas, mayúsculas y números",
      },
      { status: 400 },
    );
  }

  try {
    await dbConnect();

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      email,
      name,
      password_hash: passwordHash,
      testimonial_done: false,
      credits_balance_cents: 6, // 6 centavos (0.06 dólares) para 2 posts de prueba
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al registrar usuario en MongoDB:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo registrar el usuario: " + message },
      { status: 500 },
    );
  }
}
