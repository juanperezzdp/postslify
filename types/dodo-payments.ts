export type DodoCheckoutSessionResponse = {
  session_id: string;
  checkout_url: string | null;
};

export type DodoPaymentStatus =
  | "succeeded"
  | "failed"
  | "cancelled"
  | "processing"
  | "requires_action"
  | "requires_payment_method";

export type DodoPaymentResponse = {
  payment_id: string;
  checkout_session_id?: string;
  total_amount: number;
  currency: string;
  status: DodoPaymentStatus;
  metadata?: Record<string, string>;
};
