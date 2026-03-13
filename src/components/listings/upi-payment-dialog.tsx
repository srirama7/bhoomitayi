"use client";

import { useState } from "react";
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

type GatewayStep = "ready" | "loading" | "processing" | "verifying" | "success" | "failed";

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

  async function verifyPayment(orderId: string): Promise<boolean> {
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
  }

  async function initiatePayment() {
    setProcessing(true);
    setGatewayStep("loading");
    setErrorMsg("");

    try {
      // 1. Create order
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

      // 3. Hide dialog, open Cashfree checkout
      setCashfreeActive(true);
      setGatewayStep("processing");

      const result = await cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_modal" as const,
      });

      // 4. Cashfree closed
      setCashfreeActive(false);

      if (result.error) {
        setErrorMsg(result.error.message || "Payment was cancelled or failed");
        setGatewayStep("failed");
        setProcessing(false);
        return;
      }

      if (result.redirect) return;

      if (result.paymentDetails) {
        setGatewayStep("verifying");
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

  async function handleManualVerify() {
    if (!currentOrderId) { resetState(); return; }
    setProcessing(true);
    setGatewayStep("verifying");
    const verified = await verifyPayment(currentOrderId);
    setProcessing(false);
    setGatewayStep(verified ? "success" : "failed");
  }

  function handleSubmitListing() {
    if (!paymentResult) return;
    onPaymentConfirmed(paymentResult.paymentRef, paymentResult.paymentId);
  }

  return (
    <Dialog open={open && !cashfreeActive} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {gatewayStep === "failed" && (
                <button onClick={resetState} className="rounded-full p-1.5 hover:bg-white/20 transition-colors mr-1">
                  <ArrowLeft className="size-4" />
                </button>
              )}
              <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
                <IndianRupee className="size-5" />
              </div>
              <div>
                <DialogHeader className="p-0">
                  <DialogTitle className="text-white text-base font-bold">Secure Payment</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-blue-100 text-xs mt-0.5">Powered by Cashfree</DialogDescription>
              </div>
            </div>
            <button onClick={handleClose} disabled={processing} className="rounded-full p-1.5 hover:bg-white/20 transition-colors disabled:opacity-50">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-3">
          <span className="text-sm text-muted-foreground">Listing Fee</span>
          <span className="text-2xl font-bold text-foreground">₹{LISTING_FEE}.00</span>
        </div>

        {/* READY */}
        {gatewayStep === "ready" && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-medium text-muted-foreground text-center">All payment methods available</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Smartphone className="size-5" />, label: "UPI", sub: "GPay, PhonePe, Paytm", from: "from-green-500", to: "to-emerald-600" },
                { icon: <CreditCard className="size-5" />, label: "Cards", sub: "Credit & Debit", from: "from-violet-500", to: "to-purple-600" },
                { icon: <Building2 className="size-5" />, label: "Net Banking", sub: "All major banks", from: "from-blue-500", to: "to-cyan-600" },
                { icon: <Wallet className="size-5" />, label: "Wallets", sub: "All wallets", from: "from-orange-500", to: "to-amber-600" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${m.from} ${m.to} text-white`}>{m.icon}</div>
                  <div>
                    <p className="font-semibold text-xs">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" onClick={initiatePayment} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base">
              <Lock className="size-4" />Pay ₹{LISTING_FEE}.00 Now
            </Button>
          </div>
        )}

        {/* LOADING / PROCESSING / VERIFYING */}
        {(gatewayStep === "loading" || gatewayStep === "processing" || gatewayStep === "verifying") && (
          <div className="px-6 py-12 flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="size-16 rounded-full border-4 border-blue-200 dark:border-blue-800 animate-pulse" />
              <Loader2 className="size-8 text-blue-600 animate-spin absolute top-4 left-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {gatewayStep === "loading" ? "Initializing Payment" : gatewayStep === "verifying" ? "Verifying Payment" : "Processing Payment"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {gatewayStep === "loading" ? "Setting up secure checkout..." : gatewayStep === "verifying" ? "Confirming your payment..." : "Complete payment in the Cashfree window..."}
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {gatewayStep === "success" && paymentResult && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-9 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">₹{paymentResult.amount}.00 paid successfully</p>
            </div>
            <div className="w-full rounded-lg border bg-muted/20 px-4 py-3 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Payment ID</span><span className="font-mono font-semibold">{String(paymentResult.paymentId).slice(0, 20)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono font-semibold">{paymentResult.paymentRef}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-semibold text-green-600">Verified</span></div>
            </div>
            <Button onClick={handleSubmitListing} disabled={submitting} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white mt-2">
              {submitting ? (<><Loader2 className="size-4 animate-spin" />Publishing listing...</>) : (<><CheckCircle2 className="size-4" />Publish Listing Now</>)}
            </Button>
          </div>
        )}

        {/* FAILED */}
        {gatewayStep === "failed" && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="size-9 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Payment Failed</h3>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg || "Something went wrong. Please try again."}</p>
            </div>
            <div className="w-full space-y-2">
              <Button onClick={resetState} variant="outline" className="w-full">Try Again</Button>
              {currentOrderId && (
                <Button onClick={handleManualVerify} variant="ghost" className="w-full text-xs">Already paid? Verify payment</Button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t bg-muted/30 px-6 py-2.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-blue-600" />Powered by Cashfree
          <span className="mx-1">|</span>
          <ShieldCheck className="size-3.5 text-green-600" />PCI DSS Compliant
        </div>
      </DialogContent>
    </Dialog>
  );
}
