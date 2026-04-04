import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDodoCheckoutSession } from "@/lib/dodo-payments";
import type { BillingPlanId, CreateOrderResponse } from "@/types/billing";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

const PLAN_AMOUNT_CENTS: Record<BillingPlanId, number> = {
  "10": 1000,
  "25": 2500,
  "50": 5000,
};

const getPlanProductId = (planId: BillingPlanId) => {
  const productByPlan: Record<BillingPlanId, string | undefined> = {
    "10": process.env.DODO_PRODUCT_ID_10,
    "25": process.env.DODO_PRODUCT_ID_25,
    "50": process.env.DODO_PRODUCT_ID_50,
  };

  return productByPlan[planId];
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { planId?: BillingPlanId; locale?: string };
  const planId = body?.planId;
  const locale = body?.locale === "es" ? "es" : "en";

  if (!planId || !PLAN_AMOUNT_CENTS[planId]) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const productId = getPlanProductId(planId);
  if (!productId) {
    return NextResponse.json(
      { error: "Falta configurar el product ID de Dodo Payments para este plan" },
      { status: 500 }
    );
  }

    const origin = request.nextUrl.origin;
  const returnUrl = `${origin}/${locale}/${session.user.id}/billing`;
  const cancelUrl = `${origin}/${locale}/${session.user.id}/billing?dodo=cancel`;
  const amountCents = PLAN_AMOUNT_CENTS[planId];
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  try {
    const transactionId = new mongoose.Types.ObjectId();
    const checkoutSession = await createDodoCheckoutSession({
      productId,
      returnUrl,
      cancelUrl,
      metadata: {
        userId: session.user.id,
        planId,
        transactionId: transactionId.toString(),
      },
    });

    if (!checkoutSession.checkout_url) {
      return NextResponse.json(
        { error: "No se recibió checkout_url de Dodo Payments" },
        { status: 500 }
      );
    }

    await dbConnect();
    await Transaction.create({
      _id: transactionId,
      user_id: session.user.id,
      amount_cents: amountCents,
      currency: "USD",
      type: "purchase",
      provider: "dodo",
      provider_order_id: checkoutSession.session_id,
      status: "pending",
      expiresAt,
    });

    const response: CreateOrderResponse = {
      orderId: checkoutSession.session_id,
      approvalUrl: checkoutSession.checkout_url,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating Dodo checkout session:", error);
    const message = error instanceof Error ? error.message : "Error al crear checkout session";
    if (/401|unauthorized/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Dodo Payments devolvió 401 Unauthorized. Revisa que DODO_PAYMENTS_API_KEY sea una Secret Key válida del entorno correcto (test/live), sin espacios/comillas, y reinicia el servidor.",
        },
        { status: 401 }
      );
    }
    if (/rbac/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Dodo Payments rechazó la solicitud por permisos (RBAC). Verifica que la API key sea la correcta del mismo negocio y que los DODO_PRODUCT_ID_* pertenezcan al mismo entorno/cuenta.",
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
