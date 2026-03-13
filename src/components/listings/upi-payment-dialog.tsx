"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  IndianRupee,
  ShieldCheck,
  X,
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  ArrowLeft,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { load } from "@cashfreepayments/cashfree-js";

const LISTING_FEE = 1;

interface PaymentGatewayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentConfirmed: (paymentRef: string, paymentId: string) => void;
  submitting: boolean;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

type GatewayStep = "ready" | "loading" | "processing" | "success" | "failed";

interface PaymentResult {
  paymentId: string;
  paymentRef: string;
  amount: number;
  paymentMethod: string;
}

export function PaymentGateway({
  open,
  onOpenChange,
  onPaymentConfirmed,
  submitting,
  userId,
  customerName,
  customerEmail,
  customerPhone,
}: PaymentGatewayProps) {
  const [gatewayStep, setGatewayStep] = useState<GatewayStep>("ready");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [cashfreeActive, setCashfreeActive] = useState(false);

  function resetState() {
    setGatewayStep("ready");
    setProcessing(false);
    setErrorMsg("");
    setPaymentResult(null);
    setCurrentOrderId(null);
    setCashfreeActive(false);
  }

  function handleClose() {
    if (processing) return;
    resetState();
    onOpenChange(false);
  }

  const verifyPayment = useCallback(
    async (orderId: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const result = await res.json();

        if (result.verified) {
          setPaymentResult({
            paymentId: result.paymentId,
            paymentRef: result.paymentRef,
            amount: result.amount,
            paymentMethod: result.paymentMethod,
          });
          return true;
        }

        setErrorMsg(result.error || "Payment not completed");
        return false;
      } catch {
        setErrorMsg("Payment verification failed. Please contact support.");
        return false;
      }
    },
    []
  );

  async function initiatePayment() {
    setProcessing(true);
    setGatewayStep("loading");
    setErrorMsg("");

    try {
      // 1. Create order on server via Cashfree API
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: LISTING_FEE,
          userId,
          customerName,
          customerEmail,
          customerPhone,
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const orderData = await res.json();
      setCurrentOrderId(orderData.orderId);

      // 2. Initialize Cashfree SDK
      const cashfree = await load({ mode: "production" });

      // 3. Hide our dialog so Cashfree modal can receive clicks
      setCashfreeActive(true);
      setGatewayStep("processing");

      const checkoutOptions = {
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_modal" as const,
      };

      const result = await cashfree.checkout(checkoutOptions);

      // 4. Cashfree modal closed — show our dialog again
      setCashfreeActive(false);

      if (result.error) {
        console.error("Cashfree checkout error:", result.error);
        setErrorMsg(
          result.error.message || "Payment was cancelled or failed"
        );
        setGatewayStep("failed");
        setProcessing(false);
        return;
      }

      if (result.redirect) {
        // Payment is being redirected — will come back via callback
        return;
      }

      if (result.paymentDetails) {
        // Payment completed — verify on server
        const verified = await verifyPayment(orderData.orderId);
        setProcessing(false);
        setGatewayStep(verified ? "success" : "failed");
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setCashfreeActive(false);
      setErrorMsg("Could not initiate payment. Please try again.");
      setGatewayStep("failed");
      setProcessing(false);
    }
  }

  function handleSubmitListing() {
    if (!paymentResult) return;
    onPaymentConfirmed(paymentResult.paymentRef, paymentResult.paymentId);
  }

  async function handleRetryVerification() {
    if (!currentOrderId) {
      resetState();
      return;
    }
    setProcessing(true);
    setGatewayStep("processing");
    const verified = await verifyPayment(currentOrderId);
    setProcessing(false);
    setGatewayStep(verified ? "success" : "failed");
  }

  return (
    <Dialog open={open && !cashfreeActive} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {gatewayStep === "failed" && (
                <button
                  onClick={resetState}
                  className="rounded-full p-1.5 hover:bg-white/20 transition-colors mr-1"
                >
                  <ArrowLeft className="size-4" />
                </button>
              )}
              <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
                <IndianRupee className="size-5" />
              </div>
              <div>
                <DialogHeader className="p-0">
                  <DialogTitle className="text-white text-base font-bold">
                    Cashfree Payments
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-blue-100 text-xs mt-0.5">
                  Secure Payment Gateway
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={processing}
              className="rounded-full p-1.5 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Amount bar */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-3">
          <span className="text-sm text-muted-foreground">Listing Fee</span>
          <span className="text-2xl font-bold text-foreground">
            ₹{LISTING_FEE}.00
          </span>
        </div>

        {/* ===== READY - Pay Now Screen ===== */}
        {gatewayStep === "ready" && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-medium text-muted-foreground text-center">
              All payment methods available
            </p>

            {/* Payment methods showcase */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs">UPI</p>
                  <p className="text-[10px] text-muted-foreground">
                    GPay, PhonePe, Paytm
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs">Cards</p>
                  <p className="text-[10px] text-muted-foreground">
                    Credit & Debit
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs">Net Banking</p>
                  <p className="text-[10px] text-muted-foreground">
                    All major banks
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs">Wallets & EMI</p>
                  <p className="text-[10px] text-muted-foreground">
                    Pay Later, EMI
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={initiatePayment}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
            >
              <Lock className="size-4" />
              Pay ₹{LISTING_FEE}.00 Now
            </Button>

            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground pt-1">
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
                VISA
              </span>
              <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">
                MC
              </span>
              <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold">
                RuPay
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold">
                UPI
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold">
                EMI
              </span>
            </div>
          </div>
        )}

        {/* ===== LOADING SCREEN ===== */}
        {gatewayStep === "loading" && (
          <div className="px-6 py-12 flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-blue-200 dark:border-blue-800 animate-pulse" />
              <Loader2 className="size-8 text-blue-600 animate-spin absolute top-4 left-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Initializing Payment</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Setting up secure checkout...
              </p>
            </div>
          </div>
        )}

        {/* ===== PROCESSING SCREEN ===== */}
        {gatewayStep === "processing" && (
          <div className="px-6 py-12 flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-blue-200 dark:border-blue-800 animate-pulse" />
              <Loader2 className="size-8 text-blue-600 animate-spin absolute top-4 left-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Processing Payment</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please complete payment in the Cashfree window...
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Do not close this window
              </p>
            </div>
            {currentOrderId && (
              <div className="rounded-lg border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                Order ID:{" "}
                <span className="font-mono">
                  {currentOrderId.slice(0, 24)}...
                </span>
              </div>
            )}
          </div>
        )}

        {/* ===== SUCCESS SCREEN ===== */}
        {gatewayStep === "success" && paymentResult && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-9 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
                Payment Successful!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ₹{paymentResult.amount}.00 paid successfully
              </p>
            </div>

            <div className="w-full rounded-lg border bg-muted/20 px-4 py-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono font-semibold">
                  {String(paymentResult.paymentId).slice(0, 20)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-semibold">
                  {paymentResult.paymentRef}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold capitalize">
                  {paymentResult.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold text-green-600">Verified</span>
              </div>
            </div>

            <Button
              onClick={handleSubmitListing}
              disabled={submitting}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publishing listing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Publish Listing Now
                </>
              )}
            </Button>
          </div>
        )}

        {/* ===== FAILED SCREEN ===== */}
        {gatewayStep === "failed" && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="size-9 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                Payment Failed
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMsg || "Something went wrong. Please try again."}
              </p>
            </div>
            <div className="w-full space-y-2">
              <Button
                onClick={resetState}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
              {currentOrderId && (
                <Button
                  onClick={handleRetryVerification}
                  variant="ghost"
                  className="w-full text-xs"
                >
                  Already paid? Verify payment
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer trust bar */}
        <div className="border-t bg-muted/30 px-6 py-2.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-blue-600" />
          Powered by Cashfree
          <span className="mx-1">|</span>
          <ShieldCheck className="size-3.5 text-green-600" />
          PCI DSS Compliant
        </div>
      </DialogContent>
    </Dialog>
  );
}
