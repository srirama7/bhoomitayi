"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Loader2,
  IndianRupee,
  ShieldCheck,
  X,
  Smartphone,
  ArrowLeft,
  Lock,
  AlertCircle,
  QrCode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const LISTING_FEE = 10;

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

type GatewayStep = "ready" | "loading" | "qr" | "success" | "failed";

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
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [upiLink, setUpiLink] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function resetState() {
    stopPolling();
    setGatewayStep("ready");
    setProcessing(false);
    setErrorMsg("");
    setPaymentResult(null);
    setCurrentOrderId(null);
    setQrDataUrl(null);
    setUpiLink(null);
  }

  function handleClose() {
    if (processing && gatewayStep !== "qr") return;
    resetState();
    onOpenChange(false);
  }

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

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

        return false;
      } catch {
        return false;
      }
    },
    []
  );

  // Start polling for payment status when QR is shown
  function startPolling(orderId: string) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const verified = await verifyPayment(orderId);
      if (verified) {
        stopPolling();
        setProcessing(false);
        setGatewayStep("success");
      }
    }, 4000);
  }

  async function initiatePayment() {
    setProcessing(true);
    setGatewayStep("loading");
    setErrorMsg("");

    try {
      // 1. Create order on server
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

      // 2. Get UPI QR code from server
      const upiRes = await fetch("/api/payment/upi-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentSessionId: orderData.paymentSessionId,
        }),
      });

      if (!upiRes.ok) {
        const errData = await upiRes.json();
        throw new Error(errData.error || "Failed to generate UPI QR");
      }

      const upiData = await upiRes.json();
      setQrDataUrl(upiData.qrDataUrl);
      setUpiLink(upiData.upiLink);
      setGatewayStep("qr");

      // 3. Start polling for payment completion
      startPolling(orderData.orderId);
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Could not initiate payment. Please try again."
      );
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
    const verified = await verifyPayment(currentOrderId);
    setProcessing(false);
    if (verified) {
      setGatewayStep("success");
    } else {
      setErrorMsg("Payment not found yet. Please complete the payment and try again.");
      setGatewayStep("failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 text-white">
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
                    UPI Payment
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-green-100 text-xs mt-0.5">
                  Scan & Pay with any UPI app
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
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
            <div className="flex items-center justify-center gap-3 rounded-xl bg-muted/40 px-4 py-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <Smartphone className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-sm">Pay via UPI</p>
                <p className="text-xs text-muted-foreground">
                  GPay, PhonePe, Paytm, BHIM & more
                </p>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              A QR code will be generated. Scan it with any UPI app to pay.
            </p>

            <Button
              type="button"
              onClick={initiatePayment}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white h-12 text-base"
            >
              <QrCode className="size-4" />
              Generate QR Code - ₹{LISTING_FEE}.00
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-1">
              <Lock className="size-3" />
              Secured by Cashfree &bull; UPI Powered
            </div>
          </div>
        )}

        {/* ===== LOADING SCREEN ===== */}
        {gatewayStep === "loading" && (
          <div className="px-6 py-12 flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-green-200 dark:border-green-800 animate-pulse" />
              <Loader2 className="size-8 text-green-600 animate-spin absolute top-4 left-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Generating QR Code</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Setting up your UPI payment...
              </p>
            </div>
          </div>
        )}

        {/* ===== QR CODE SCREEN ===== */}
        {gatewayStep === "qr" && qrDataUrl && (
          <div className="px-6 py-5 flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Scan with any UPI app to pay
            </p>

            {/* QR Code */}
            <div className="rounded-2xl border-2 border-green-200 dark:border-green-800 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="UPI QR Code"
                width={280}
                height={280}
                className="rounded-lg"
              />
            </div>

            {/* UPI App Button (for mobile) */}
            {upiLink && (
              <a
                href={upiLink}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              >
                <Smartphone className="size-4" />
                Open UPI App to Pay
              </a>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-green-600" />
              Waiting for payment...
            </div>

            <button
              onClick={handleRetryVerification}
              className="text-xs text-green-600 hover:underline"
            >
              Already paid? Check status
            </button>

            {currentOrderId && (
              <div className="rounded-lg border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                Order: <span className="font-mono">{currentOrderId.slice(0, 24)}...</span>
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
                ₹{paymentResult.amount}.00 paid via UPI
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
          <Lock className="size-3.5 text-green-600" />
          UPI Secured Payment
          <span className="mx-1">|</span>
          <ShieldCheck className="size-3.5 text-green-600" />
          Powered by Cashfree
        </div>
      </DialogContent>
    </Dialog>
  );
}
