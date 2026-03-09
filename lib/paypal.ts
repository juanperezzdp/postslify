import type { PayPalCaptureOrderResponse, PayPalCreateOrderResponse } from "@/types/paypal";

const getPayPalBaseUrl = (env?: string) =>
  env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const getPayPalCredentials = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not found");
  }

  return { clientId, clientSecret };
};

const parsePayPalError = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return "PayPal error";
  }

  try {
    const json = JSON.parse(text) as { name?: string; message?: string; details?: unknown };
    return JSON.stringify(json);
  } catch {
    return text;
  }
};

export const getPayPalAccessToken = async () => {
  const { clientId, clientSecret } = getPayPalCredentials();
  const baseUrl = getPayPalBaseUrl(process.env.PAYPAL_ENV);
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await parsePayPalError(response);
    throw new Error(error);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
};

export const createPayPalOrder = async (input: {
  amountCents: number;
  returnUrl: string;
  cancelUrl: string;
}) => {
  const baseUrl = getPayPalBaseUrl(process.env.PAYPAL_ENV);
  const accessToken = await getPayPalAccessToken();
  const amount = (input.amountCents / 100).toFixed(2);

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
        },
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });

  if (!response.ok) {
    const error = await parsePayPalError(response);
    throw new Error(error);
  }

  return (await response.json()) as PayPalCreateOrderResponse;
};

export const capturePayPalOrder = async (orderId: string) => {
  const baseUrl = getPayPalBaseUrl(process.env.PAYPAL_ENV);
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await parsePayPalError(response);
    throw new Error(error);
  }

  return (await response.json()) as PayPalCaptureOrderResponse;
};
