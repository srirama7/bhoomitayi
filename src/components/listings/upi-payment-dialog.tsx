"use client";

import { useState } from "react";
import {
  CheckCircle2,
  X,
  Smartphone,
  Clock,
  Zap,
  ArrowLeft,
  Copy,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentGatewayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentConfirmed: (plan?: typeof PLANS[0]) => void;
  submitting: boolean;
  flowLabel?: string;
  reviewMessage?: string;
  submitLabel?: string;
}

type GatewayStep = "qr" | "confirmed";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 249,
    days: 30,
    badge: null,
    badgeColor: "",
    bonus: null,
  },
  {
    id: "plus",
    name: "Plus",
    price: 499,
    days: 100,
    badge: "BEGINNER PICK",
    badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    bonus: "+15%",
  },
  {
    id: "pro",
    name: "Pro",
    price: 749,
    days: 180,
    badge: "MOST POPULAR",
    badgeColor: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    bonus: "+25%",
  },
  {
    id: "ultramax",
    name: "Ultra Max Pro",
    price: 999,
    days: 365,
    badge: "BEST VALUE",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    bonus: "+40%",
  },
];

export function PaymentGateway({
  open,
  onOpenChange,
  onPaymentConfirmed,
  submitting,
  reviewMessage = "Your listing will be submitted and reviewed by our admin. Once your payment is verified, your listing will go live.",
  submitLabel = "Already Paid? Submit",
}: PaymentGatewayProps) {
  const [step, setStep] = useState<GatewayStep>("qr");
  const [selectedPlanId, setSelectedPlanId] = useState("pro");

  function handleClose() {
    if (submitting) return;
    setStep("qr");
    onOpenChange(false);
  }

  function handlePaidConfirm() {
    setStep("confirmed");
  }

  function handleSubmitListing() {
    const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];
    onPaymentConfirmed(selectedPlan);
  }

  function copyUpi() {
    navigator.clipboard.writeText("amoghabhat7403@oksbi");
    toast.success("UPI ID copied to clipboard!");
  }

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[1000px] h-[90vh] max-h-[700px] bg-[#111111] border-zinc-800 text-zinc-100 flex flex-col shadow-2xl"
      >
        {/* Top Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#161616]">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="rounded-full p-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h2 className="text-lg font-semibold tracking-wide text-zinc-100">Add Money / Checkout</h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Main Content Area */}
        {step === "qr" && (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Left Column: Plans */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#111111] custom-scrollbar">
              <div className="flex items-center gap-3 mb-2">
                <Image src="/logo-v2.png" alt="Logo" width={24} height={24} className="rounded-full object-cover" />
                <h3 className="text-2xl font-bold text-white tracking-tight">Booster Packs</h3>
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 rounded-md border border-red-500/20">
                  Limited Time
                </span>
              </div>
              <p className="text-zinc-400 mb-8 text-sm">Pay less, get more visibility</p>

              <div className="grid grid-cols-2 gap-4">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <motion.div
                      key={plan.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                          : "border-zinc-800 bg-[#1A1A1A] hover:border-zinc-700"
                      }`}
                    >
                      {plan.badge && (
                        <div
                          className={`absolute -top-3 left-4 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md ${plan.badgeColor}`}
                        >
                          {plan.badge}
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white">₹{plan.price}</span>
                        </div>
                        <div className="text-blue-400 font-medium mt-1">Get {plan.days} Days</div>
                        {plan.bonus && (
                          <div className="text-emerald-400 text-xs font-semibold mt-1.5">
                            {plan.bonus} Visibility
                          </div>
                        )}
                        <div className="text-zinc-500 text-[11px] mt-3 font-medium">
                          ≈ ₹{(plan.price / plan.days).toFixed(1)} / day
                        </div>
                      </div>

                      {isSelected && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="absolute inset-0 border-2 border-blue-500 rounded-2xl pointer-events-none"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Custom Input Mockup */}
              <div className="mt-8 flex items-center bg-[#1A1A1A] border border-zinc-800 rounded-xl p-4">
                <span className="text-zinc-400 font-medium mr-4">Custom ₹</span>
                <span className="text-zinc-600 text-sm">Min ₹249</span>
              </div>
            </div>

            {/* Right Column: Payment */}
            <div className="w-full md:w-[400px] border-l border-zinc-800/80 bg-[#161616] p-6 md:p-8 flex flex-col justify-center">
              <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/50 p-6 flex flex-col items-center relative overflow-hidden shadow-2xl">
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-6 text-blue-400">
                  <ShieldCheck className="size-5" />
                  <span className="font-semibold text-sm">Secure UPI Payment</span>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-inner w-[240px] h-[240px] relative z-10">
                  <Image
                    src="/qr_code.png"
                    alt="UPI QR Code"
                    fill
                    className="object-contain p-2"
                    priority
                  />
                </div>
                
                <p className="mt-6 text-2xl font-bold text-white tracking-tight">
                  Pay ₹{selectedPlan.price}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                  <Smartphone className="size-3.5" />
                  Scan with GPay, PhonePe, Paytm
                </div>

                <button 
                  onClick={copyUpi}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors text-sm font-medium text-zinc-300 hover:text-white"
                >
                  <Copy className="size-4" />
                  Copy UPI ID: amoghabhat7403@oksbi
                </button>
              </div>

              <p className="text-center text-[11px] text-zinc-500 mt-6 mb-4">
                By proceeding, you agree to our Terms & Conditions. Payment is strictly non-refundable.
              </p>

              <Button
                onClick={handlePaidConfirm}
                className="h-14 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Step */}
        {step === "confirmed" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#111111]">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex size-24 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 relative"
            >
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
              <Clock className="size-10 text-amber-500 relative z-10" />
            </motion.div>
            
            <h3 className="mt-8 text-2xl font-bold text-white">
              Payment Under Review
            </h3>
            <p className="mt-3 text-zinc-400 text-center max-w-md leading-relaxed">
              {reviewMessage}
            </p>

            <div className="mt-8 bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-5 w-full max-w-sm flex justify-between items-center shadow-lg">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Selected Plan</p>
                <p className="text-white font-bold text-lg">{selectedPlan.name} ({selectedPlan.days} Days)</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 font-medium">Amount Paid</p>
                <p className="text-blue-400 font-bold text-lg">₹{selectedPlan.price}</p>
              </div>
            </div>

            <Button
              onClick={handleSubmitListing}
              disabled={submitting}
              className="mt-8 h-14 w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5" />
                  Submit to Admin
                </div>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
