import DodoPayments from "dodopayments";
import type { DodoCheckoutSessionResponse, DodoPaymentResponse } from "@/types/dodo-payments";

const getDodoApiKey = () => {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim().replace(/^["'`]|["'`]$/g, "");
  if (!apiKey) {
    throw new Error("Dodo Payments API key not found");
  }
  return apiKey;
};

const getDodoEnvironment = () => {
  const configuredBaseUrl = process.env.DODO_PAYMENTS_BASE_URL || "";
  if (configuredBaseUrl.includes("test.dodopayments.com")) {
    return "test_mode" as const;
  }
  return "live_mode" as const;
};

const getDodoClient = () => {
  return new DodoPayments({
    bearerToken: getDodoApiKey(),
    environment: getDodoEnvironment(),
    baseURL: null,
  });
};

export const createDodoCheckoutSession = async (input: {
  productId: string;
  returnUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) => {
  const client = getDodoClient();
  const response = await client.checkoutSessions.create({
    product_cart: [
      {
        product_id: input.productId,
        quantity: 1,
      },
    ],
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    metadata: input.metadata,
    billing_currency: "USD",
  });

  const mapped: DodoCheckoutSessionResponse = {
    session_id: response.session_id,
    checkout_url: response.checkout_url ?? null,
  };

  return mapped;
};

export const getDodoPaymentDetail = async (paymentId: string) => {
  const client = getDodoClient();
  const response = await client.payments.retrieve(paymentId);
  const normalizedStatus: DodoPaymentResponse["status"] =
    response.status === "succeeded"
      ? "succeeded"
      : response.status === "processing"
        ? "processing"
        : response.status === "cancelled"
          ? "cancelled"
          : response.status === "requires_customer_action"
            ? "requires_action"
            : response.status === "requires_payment_method"
              ? "requires_payment_method"
              : "failed";

  const mapped: DodoPaymentResponse = {
    payment_id: response.payment_id,
    checkout_session_id: response.checkout_session_id ?? undefined,
    total_amount: response.total_amount,
    currency: response.currency,
    status: normalizedStatus,
    metadata: response.metadata,
  };

  return mapped;
};
