"use client";

import { useState } from "react";
import {
  CheckCircle2,
  IndianRupee,
  X,
  Smartphone,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { LISTING_FEE } from "@/lib/listing-timer";

interface PaymentGatewayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentConfirmed: () => void;
  submitting: boolean;
  flowLabel?: string;
  reviewMessage?: string;
  submitLabel?: string;
}

type GatewayStep = "qr" | "confirmed";

export function PaymentGateway({
  open,
  onOpenChange,
  onPaymentConfirmed,
  submitting,
  flowLabel = "Listing Fee",
  reviewMessage = "Your listing will be submitted and reviewed by our admin. Once your payment is verified, your listing will go live.",
  submitLabel = "Submit Listing for Review",
}: PaymentGatewayProps) {
  const [step, setStep] = useState<GatewayStep>("qr");

  function handleClose() {
    if (submitting) return;
    setStep("qr");
    onOpenChange(false);
  }

  function handlePaidConfirm() {
    setStep("confirmed");
  }

  function handleSubmitListing() {
    onPaymentConfirmed();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[420px]"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
                <IndianRupee className="size-5" />
              </div>
              <div>
                <DialogHeader className="p-0">
                  <DialogTitle className="text-base font-bold text-white">
                    Pay via UPI
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription className="mt-0.5 text-xs text-blue-100">
                  Scan QR code to pay
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="rounded-full p-1.5 transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-3">
          <span className="text-sm text-muted-foreground">{flowLabel}</span>
          <span className="text-2xl font-bold text-foreground">₹{LISTING_FEE}.00</span>
        </div>

        {step === "qr" && (
          <div className="space-y-4 px-6 py-5">
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-[250px] w-[250px] overflow-hidden rounded-xl border-2 border-gray-200">
                <Image
                  src="/qr_code.png"
                  alt="UPI QR Code"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-foreground">
                  Scan with any UPI app
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Smartphone className="size-3.5" />
                  GPay, PhonePe, Paytm, etc.
                </div>
                <p className="mt-1 text-xs font-mono text-muted-foreground">
                  UPI ID: amoghabhat7403@oksbi
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-center text-xs text-amber-700 dark:text-amber-400">
                After paying ₹{LISTING_FEE}, click the button below to confirm.
                Admin will review the payment before the timer can start.
              </p>
            </div>

            <Button
              type="button"
              onClick={handlePaidConfirm}
              className="h-12 w-full gap-2 bg-green-600 text-base text-white hover:bg-green-700"
            >
              <CheckCircle2 className="size-5" />
              I&apos;ve Paid ₹{LISTING_FEE}
            </Button>
          </div>
        )}

        {step === "confirmed" && (
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="size-9 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">
                Payment Under Review
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {reviewMessage}
              </p>
            </div>
            <Button
              onClick={handleSubmitListing}
              disabled={submitting}
              className="mt-2 w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 border-t bg-muted/30 px-6 py-2.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 text-amber-600" />
          Admin approval required before listing goes live
        </div>
      </DialogContent>
    </Dialog>
  );
}
