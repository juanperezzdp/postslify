import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import type { CreditsBalance } from "@/types/billing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const user = await User.findById(session.user.id).select(
      "credits_balance_cents"
    );

    const response: CreditsBalance = {
      balanceCents: user?.credits_balance_cents ?? 0,
      currency: "USD",
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener el balance" },
      { status: 500 },
    );
  }
}
