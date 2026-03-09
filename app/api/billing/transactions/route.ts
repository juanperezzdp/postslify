import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import type { CreditTransactionSummary } from "@/types/billing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    await dbConnect();

    const transactions = await Transaction.find({
      user_id: session.user.id,
      type: "purchase",
      provider: "paypal",
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const items: CreditTransactionSummary[] = transactions.map((row) => ({
      id: row._id.toString(), 
      amountCents: row.amount_cents,
      currency: (row.currency || "USD") as "USD",
      type: "purchase",
      provider: "paypal",
      providerOrderId: row.provider_order_id ?? null,
      status: row.status as "pending" | "completed" | "failed" | "canceled",
      createdAt: row.createdAt.toISOString(),
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "No se pudo obtener el historial de pagos" },
      { status: 500 }
    );
  }
}
