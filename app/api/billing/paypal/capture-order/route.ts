import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { capturePayPalOrder } from "@/lib/paypal";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

const parseAmountToCents = (amount: string) => {
  const normalized = amount.trim();
  const [whole, fraction = ""] = normalized.split(".");
  const cents = `${fraction}00`.slice(0, 2);
  const wholeValue = Number.parseInt(whole || "0", 10);
  const centsValue = Number.parseInt(cents || "0", 10);
  return wholeValue * 100 + centsValue;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as { orderId?: string };
  const orderId = body?.orderId;

  if (!orderId) {
    return NextResponse.json(
      { error: "OrderId inválido" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const capture = await capturePayPalOrder(orderId);

    if (capture.status !== "COMPLETED") {
      const fallbackExpiry = new Date();
      fallbackExpiry.setMonth(fallbackExpiry.getMonth() + 6);
      const existing = await Transaction.findOne({ provider_order_id: orderId });
      if (existing) {
        existing.status = "failed";
        existing.expiresAt = existing.expiresAt ?? fallbackExpiry;
        await existing.save();
      }
      return NextResponse.json(
        { error: "La captura no fue completada" },
        { status: 400 }
      );
    }

    const amountValue =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? "0";
    const currency =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code ?? "USD";
    const amountCents = parseAmountToCents(amountValue);

    if (currency !== "USD" || amountCents <= 0) {
      return NextResponse.json(
        { error: "Monto inválido" },
        { status: 400 }
      );
    }

    const existing = await Transaction.findOne({ provider_order_id: orderId });

    if (existing && existing.user_id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Orden no válida" },
        { status: 403 }
      );
    }

    if (existing?.status === "completed") {
      if (existing.expiresAt) {
        existing.expiresAt = undefined;
        await existing.save();
      }
      const user = await User.findById(session.user.id);
      return NextResponse.json({
        success: true,
        balanceCents: user?.credits_balance_cents ?? 0,
      });
    }

    if (existing?.amount_cents && existing.amount_cents !== amountCents) {
      return NextResponse.json(
        { error: "Monto no coincide" },
        { status: 400 }
      );
    }

    if (existing) {
      existing.status = "completed";
      existing.expiresAt = undefined;
      await existing.save();
    } else {
        await Transaction.create({
            user_id: session.user.id,
            amount_cents: amountCents,
            currency: "USD",
            type: "purchase",
            provider: "paypal",
            provider_order_id: orderId,
            status: "completed",
            expiresAt: undefined,
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        { $inc: { credits_balance_cents: amountCents } },
        { returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      balanceCents: updatedUser?.credits_balance_cents ?? 0,
    });
  } catch (error) {
    console.error("Error capturing order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al capturar la orden" },
      { status: 500 }
    );
  }
}
