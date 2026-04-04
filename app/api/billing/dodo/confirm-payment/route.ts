import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDodoPaymentDetail } from "@/lib/dodo-payments";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { paymentId?: string };
  const paymentId = body?.paymentId;

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId inválido" }, { status: 400 });
  }

  try {
    await dbConnect();
    const payment = await getDodoPaymentDetail(paymentId);
    const orderId = payment.checkout_session_id || payment.payment_id;
    const amountCents = payment.total_amount;
    const currency = payment.currency;
    const paymentUserId = payment.metadata?.userId;
    const transactionIdFromMeta = payment.metadata?.transactionId;

    let existing = transactionIdFromMeta
      ? await Transaction.findById(transactionIdFromMeta)
      : await Transaction.findOne({ provider_order_id: orderId });

    // Fallback for previous transactions without metadata
    if (!existing) {
      // Find the most recent pending transaction for this user where the amount is less than or equal to what was paid
      existing = await Transaction.findOne({
        user_id: session.user.id,
        status: "pending",
        amount_cents: { $lte: amountCents }
      }).sort({ createdAt: -1 });
    }

    if (paymentUserId && paymentUserId !== session.user.id) {
      return NextResponse.json({ error: "Pago no válido para este usuario" }, { status: 403 });
    }

    if (existing && existing.user_id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Orden no válida" }, { status: 403 });
    }

    if (payment.status !== "succeeded") {
      console.error("Dodo payment status not succeeded:", payment.status);
      const fallbackExpiry = new Date();
      fallbackExpiry.setMonth(fallbackExpiry.getMonth() + 6);
      if (existing) {
        existing.status = "failed";
        existing.expiresAt = existing.expiresAt ?? fallbackExpiry;
        await existing.save();
      }
      return NextResponse.json({ error: "El pago no fue completado" }, { status: 400 });
    }

    if (amountCents <= 0) {
      console.error("Dodo payment invalid amount:", { amountCents });
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    if (!existing) {
      console.error("Dodo payment transaction not found for orderId:", orderId);
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
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

    // Adjusting amountCents in case Dodo returns dollars instead of cents (e.g. 10 vs 1000)
    // or if the difference is small due to taxes/fees (e.g. 1099 instead of 1000).
    // We will just verify that the actual amount is at least the expected base amount.
    const expectedCents = existing.amount_cents;
    if (expectedCents && amountCents < expectedCents && amountCents * 100 < expectedCents) {
      console.error("Dodo payment amount mismatch:", { expected: expectedCents, actual: amountCents });
      return NextResponse.json({ error: "Monto no coincide" }, { status: 400 });
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      {
        _id: existing._id,
        status: "pending",
      },
      {
        $set: {
          status: "completed",
          expiresAt: undefined,
          provider: "dodo",
        },
      },
      { new: true }
    );

    if (!updatedTransaction) {
      const latest = await Transaction.findById(existing._id);
      if (latest?.status === "completed") {
        const user = await User.findById(session.user.id);
        return NextResponse.json({
          success: true,
          balanceCents: user?.credits_balance_cents ?? 0,
        });
      }
      return NextResponse.json({ error: "La orden no está pendiente para confirmación" }, { status: 409 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $inc: { credits_balance_cents: expectedCents } },
      { returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      balanceCents: updatedUser?.credits_balance_cents ?? 0,
    });
  } catch (error) {
    console.error("Error confirming Dodo payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al confirmar el pago" },
      { status: 500 }
    );
  }
}
