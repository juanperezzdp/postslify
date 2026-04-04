import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

const getWebhookSecret = () => {
  const secret = process.env.DODO_WEBHOOK_SECRET?.trim().replace(/^["'`]|["'`]$/g, "");
  if (!secret) {
    throw new Error("DODO_WEBHOOK_SECRET no configurado");
  }
  return secret;
};

const toHeaderRecord = (request: NextRequest) => {
  const record: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    record[key] = value;
  }
  return record;
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const headers = toHeaderRecord(request);
    const client = new DodoPayments();
    const event = client.webhooks.unwrap(payload, {
      headers,
      key: getWebhookSecret(),
    });

    if (event.type === "payment.succeeded") {
      await dbConnect();
      const orderId = event.data.checkout_session_id || event.data.payment_id;
      const transactionIdFromMeta = event.data.metadata?.transactionId;

      let transaction = transactionIdFromMeta
        ? await Transaction.findById(transactionIdFromMeta)
        : await Transaction.findOne({ provider_order_id: orderId });

      if (!transaction) {
        transaction = await Transaction.findOne({
          user_id: event.data.metadata?.userId,
          status: "pending",
          amount_cents: { $lte: event.data.total_amount }
        }).sort({ createdAt: -1 });
      }

      if (!transaction) {
        return NextResponse.json({ ok: true });
      }

      if (transaction.status === "completed") {
        return NextResponse.json({ ok: true });
      }

      if (event.data.total_amount <= 0) {
        return NextResponse.json({ ok: true });
      }

      const expectedCents = transaction.amount_cents;
      if (expectedCents && event.data.total_amount < expectedCents && event.data.total_amount * 100 < expectedCents) {
        return NextResponse.json({ ok: true });
      }

      const updatedTransaction = await Transaction.findOneAndUpdate(
        {
          _id: transaction._id,
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

      if (updatedTransaction) {
        await User.findByIdAndUpdate(transaction.user_id, {
          $inc: { credits_balance_cents: expectedCents },
        });
      }
    }

    if (event.type === "payment.failed" || event.type === "payment.cancelled") {
      const orderId = event.data.checkout_session_id || event.data.payment_id;
      const transactionIdFromMeta = event.data.metadata?.transactionId;

      await dbConnect();
      
      const query = transactionIdFromMeta 
        ? { _id: transactionIdFromMeta, status: "pending" }
        : { provider_order_id: orderId, status: "pending" };

      await Transaction.findOneAndUpdate(
        query,
        {
          $set: { status: "failed" },
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Dodo webhook error:", error);
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }
}
