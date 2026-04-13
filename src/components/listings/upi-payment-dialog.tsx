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
}

type GatewayStep = "qr" | "confirmed";

export function PaymentGateway({
  open,
  onOpenChange,
  onPaymentConfirmed,
  submitting,
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
      <DialogContent showCloseButton={false} className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
                <IndianRupee className="size-5" />
              </div>
              <div>
                <DialogHeader className="p-0">
                  <DialogTitle className="text-white text-base font-bold">Pay via UPI</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-blue-100 text-xs mt-0.5">Scan QR code to pay</DialogDescription>
              </div>
            </div>
            <button onClick={handleClose} disabled={submitting} className="rounded-full p-1.5 hover:bg-white/20 transition-colors disabled:opacity-50">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-3">
          <span className="text-sm text-muted-foreground">Listing Fee</span>
          <span className="text-2xl font-bold text-foreground">₹{LISTING_FEE}.00</span>
        </div>

        {/* QR Code Step */}
        {step === "qr" && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-[250px] h-[250px] rounded-xl overflow-hidden border-2 border-gray-200">
                <Image
                  src="/qr_code.png"
                  alt="UPI QR Code"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Scan with any UPI app</p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Smartphone className="size-3.5" />
                  GPay, PhonePe, Paytm, etc.
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-1">UPI ID: amoghabhat7403@oksbi</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                After paying ₹{LISTING_FEE}, click the button below to confirm. Your listing will be reviewed by admin before going live.
              </p>
            </div>

            <Button
              type="button"
              onClick={handlePaidConfirm}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white h-12 text-base"
            >
              <CheckCircle2 className="size-5" />
              I&apos;ve Paid ₹{LISTING_FEE}
            </Button>
          </div>
        )}

        {/* Confirmed Step */}
        {step === "confirmed" && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="size-9 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">Payment Under Review</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your listing will be submitted and reviewed by our admin. Once your payment is verified, your listing will go live.
              </p>
            </div>
            <Button
              onClick={handleSubmitListing}
              disabled={submitting}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-2"
            >
              {submitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting listing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Submit Listing for Review
                </>
              )}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="border-t bg-muted/30 px-6 py-2.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 text-amber-600" />
          Admin approval required before listing goes live
        </div>
      </DialogContent>
    </Dialog>
  );
}
