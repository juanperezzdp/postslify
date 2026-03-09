export type PayPalLink = {
  href: string;
  rel: string;
  method: string;
};

export type PayPalCreateOrderResponse = {
  id: string;
  status: string;
  links: PayPalLink[];
};

export type PayPalCaptureAmount = {
  currency_code: string;
  value: string;
};

export type PayPalCapture = {
  id: string;
  status: string;
  amount: PayPalCaptureAmount;
};

export type PayPalCapturePayments = {
  captures: PayPalCapture[];
};

export type PayPalPurchaseUnit = {
  payments?: PayPalCapturePayments;
};

export type PayPalCaptureOrderResponse = {
  id: string;
  status: string;
  purchase_units?: PayPalPurchaseUnit[];
};
