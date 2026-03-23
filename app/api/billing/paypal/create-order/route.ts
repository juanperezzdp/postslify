import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPayPalOrder } from "@/lib/paypal";
import type { BillingPlanId, CreateOrderResponse } from "@/types/billing";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

const PLAN_AMOUNT_CENTS: Record<BillingPlanId, number> = {
  "5": 500,
  "10": 1000,
  "25": 2500,
  "50": 5000,
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as { planId?: BillingPlanId };
  const planId = body?.planId;

  if (!planId || !PLAN_AMOUNT_CENTS[planId]) {
    return NextResponse.json(
      { error: "Plan inválido" },
      { status: 400 }
    );
  }

  const origin = request.nextUrl.origin;
  const returnUrl = `${origin}/${session.user.id}/billing?paypal=success`;
  const cancelUrl = `${origin}/${session.user.id}/billing?paypal=cancel`;
  const amountCents = PLAN_AMOUNT_CENTS[planId];
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  try {
    const order = await createPayPalOrder({
      amountCents,
      returnUrl,
      cancelUrl,
    });

    const approvalUrl = order.links.find((link) => link.rel === "approve")?.href;
    if (!approvalUrl) {
      return NextResponse.json(
        { error: "No se encontró el enlace de aprobación" },
        { status: 500 }
      );
    }

    await dbConnect();
    await Transaction.create({
      user_id: session.user.id,
      amount_cents: amountCents,
      currency: "USD",
      type: "purchase",
      provider: "paypal",
      provider_order_id: order.id,
      status: "pending",
      expiresAt,
    });

    const response: CreateOrderResponse = {
      orderId: order.id,
      approvalUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear la orden" },
      { status: 500 }
    );
  }
}
