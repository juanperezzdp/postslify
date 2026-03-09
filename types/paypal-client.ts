export type PayPalButtonsOptions = {
  fundingSource?: string;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID?: string }) => Promise<void>;
  onError?: (error: unknown) => void;
  style?: {
    color?: string;
    shape?: string;
    label?: string;
    height?: number;
  };
};

export type PayPalButtonsInstance = {
  render: (container: HTMLElement) => Promise<void>;
};

export type PayPalNamespace = {
  Buttons: (options: PayPalButtonsOptions) => PayPalButtonsInstance;
  FUNDING?: {
    PAYPAL?: string;
    CARD?: string;
  };
};
