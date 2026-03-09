export type BillingPlanId = "5" | "10" | "25" | "50";

export type BillingPlan = {
  id: BillingPlanId;
  amountCents: number;
  label: string;
};

export type CreditsBalance = {
  balanceCents: number;
  currency: "USD";
};

export type CreateOrderResponse = {
  orderId: string;
  approvalUrl: string;
};

export type CreditTransactionStatus = "pending" | "completed" | "failed" | "canceled";

export type CreditTransactionSummary = {
  id: string;
  amountCents: number;
  currency: "USD";
  type: "purchase";
  provider: "paypal";
  providerOrderId: string | null;
  status: CreditTransactionStatus;
  createdAt?: string;
};
