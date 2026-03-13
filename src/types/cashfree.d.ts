declare module "@cashfreepayments/cashfree-js" {
  interface CashfreeConfig {
    mode: "sandbox" | "production";
  }

  interface CheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal" | "_top";
  }

  interface CheckoutResult {
    error?: {
      message: string;
      code?: string;
      type?: string;
    };
    redirect?: boolean;
    paymentDetails?: {
      paymentMessage: string;
      [key: string]: unknown;
    };
  }

  interface CashfreeInstance {
    checkout(options: CheckoutOptions): Promise<CheckoutResult>;
  }

  export function load(config: CashfreeConfig): Promise<CashfreeInstance>;
}
