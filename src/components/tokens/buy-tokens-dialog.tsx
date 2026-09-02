"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, Sparkles, QrCode, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TOKEN_PACKAGES, UPI_PAYMENT_CONFIG } from "@/lib/constants";
import { useAuthStore } from "@/lib/store";
import { submitTokenPurchaseRequest, validateCouponCode, recordCouponUsage } from "@/lib/tokens";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import type { Coupon } from "@/lib/types/database";
import { Capacitor } from "@capacitor/core";

interface BuyTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BuyTokensDialog({ open, onOpenChange, onSuccess }: BuyTokensDialogProps) {
  const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform();
  const { user, profile, setProfile } = useAuthStore();
  const [selectedPackId, setSelectedPackId] = useState<string>("pack_700");
  const [txnId, setTxnId] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"select" | "pay" | "submitted">("select");

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const selectedPack = TOKEN_PACKAGES.find((p) => p.id === selectedPackId) || TOKEN_PACKAGES[1] || TOKEN_PACKAGES[0];
  const userTokens = profile?.tokens ?? 0;
  const effectivePrice = Math.max(0, selectedPack.price - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setVerifyingCoupon(true);
    try {
      const res = await validateCouponCode(couponCode, "tokens", selectedPack.price);
      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponDiscount(res.discountAmount);
        toast.success(res.message || `Coupon "${res.coupon.code}" applied!`);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        toast.error(res.message || "Invalid coupon code");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error verifying coupon");
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_PAYMENT_CONFIG.vpa);
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToPay = () => {
    if (!user) {
      toast.error("Please log in to purchase BhoomiTayi tokens.");
      return;
    }
    setStep("pay");
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in first.");
      return;
    }

    setSubmitting(true);
    try {
      // If 100% discounted (₹0 payable), credit tokens immediately!
      if (effectivePrice === 0) {
        if (appliedCoupon) {
          await recordCouponUsage(appliedCoupon.id);
        }
        const profileRef = doc(db, "profiles", user.uid);
        const curTokens = profile?.tokens ?? 0;
        const newTotal = curTokens + selectedPack.tokens;
        await updateDoc(profileRef, {
          tokens: newTotal,
          updated_at: new Date().toISOString(),
        });
        if (setProfile && profile) {
          setProfile({ ...profile, tokens: newTotal });
        }
        await submitTokenPurchaseRequest({
          userId: user.uid,
          userName: profile?.full_name || user.displayName || "Customer",
          userEmail: user.email || profile?.email || "",
          userPhone: profile?.phone || "",
          tokens: selectedPack.tokens,
          amount: 0,
          transactionId: `COUPON-${appliedCoupon?.code || "FREE"}-${Date.now().toString().slice(-4)}`,
          notes: `[100% Free Coupon: ${appliedCoupon?.code || "FREE"}] ${notes.trim()}`,
        });
        toast.success(`🎉 100% Coupon Discount Applied! ${selectedPack.tokens} Tokens added to your wallet!`);
        setStep("submitted");
        if (onSuccess) onSuccess();
        return;
      }

      const finalTxn = txnId.trim() || `UPI-TXN-${Date.now().toString().slice(-6)}`;

      if (appliedCoupon) {
        await recordCouponUsage(appliedCoupon.id);
      }

      const res = await submitTokenPurchaseRequest({
        userId: user.uid,
        userName: profile?.full_name || user.displayName || "Customer",
        userEmail: user.email || profile?.email || "",
        userPhone: profile?.phone || "",
        tokens: selectedPack.tokens,
        amount: effectivePrice,
        transactionId: finalTxn,
        notes: `${appliedCoupon ? `[Coupon: ${appliedCoupon.code} -₹${couponDiscount}] ` : ""}${notes.trim()}`,
      });

      if (res.success) {
        toast.success("Payment request submitted successfully!");
        setStep("submitted");
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to submit request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("select");
      setTxnId("");
      setNotes("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`w-full p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-foreground shadow-2xl max-h-[90vh] flex flex-col ${isNative ? 'max-w-[100vw] h-[85vh] m-0 bottom-0 fixed rounded-t-3xl rounded-b-none' : 'max-w-[95vw] sm:max-w-lg rounded-3xl'}`}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md p-1.5 flex items-center justify-center shadow-inner">
                <Image
                  src="/token_icon.png"
                  alt="BhoomiTayi Token"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-white">
                  BhoomiTayi Tokens
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs mt-0.5">
                  Unlock verified seller contact info instantly
                </DialogDescription>
              </div>
            </div>

            <div className="text-right bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-[10px] text-white/80 uppercase font-bold block">Current Balance</span>
              <span className="text-lg font-black text-white flex items-center justify-end gap-1">
                🪙 {userTokens}
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Package Selection */}
        {step === "select" && (
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Select a Token Package
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="size-3" /> Best Value Guaranteed
              </span>
            </div>

            <div className="px-1 py-4 space-y-6">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={TOKEN_PACKAGES.length - 1}
                  value={TOKEN_PACKAGES.findIndex((p) => p.id === selectedPackId)}
                  onChange={(e) => setSelectedPackId(TOKEN_PACKAGES[parseInt(e.target.value)].id)}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-2 px-1">
                  {TOKEN_PACKAGES.map((pkg) => (
                    <div key={pkg.id} className="text-[9px] font-bold text-zinc-400">
                      {pkg.tokens}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-lg shadow-emerald-500/10 text-center relative overflow-hidden">
                {selectedPack.popular && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl">
                    POPULAR
                  </div>
                )}
                
                <div className="size-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-md flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900">
                  <Image src="/token_icon.png" alt="" width={40} height={40} className="rounded-full" />
                </div>
                
                <h3 className="text-2xl font-black text-foreground mb-1">{selectedPack.tokens} Tokens</h3>
                
                {selectedPack.tag && (
                  <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-none">
                    {selectedPack.tag}
                  </Badge>
                )}
                
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                    ₹{selectedPack.price}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground mt-1">
                    ₹{(selectedPack.price / selectedPack.tokens).toFixed(1)} / contact view
                  </span>
                </div>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>🎟️ Have a Coupon Code?</span>
                </Label>
                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[10px] text-red-500 hover:underline font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>

              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="h-9 text-xs uppercase font-mono tracking-wider rounded-xl bg-white dark:bg-zinc-800"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs shrink-0"
                    onClick={handleApplyCoupon}
                    disabled={verifyingCoupon || !couponCode.trim()}
                  >
                    {verifyingCoupon ? "..." : "Apply"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                    <span>✓ {appliedCoupon.code}</span>
                    <span className="text-[10px] font-sans font-normal">(-₹{couponDiscount})</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    Saved ₹{couponDiscount}!
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/20 text-sm gap-2"
                onClick={handleProceedToPay}
              >
                <span>Proceed to Pay {couponDiscount > 0 ? (
                  <>
                    <span className="line-through text-white/70 font-normal mr-1.5">₹{selectedPack.price}</span>
                    <span>₹{effectivePrice}</span>
                  </>
                ) : `₹${selectedPack.price}`}</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment & QR Code */}
        {step === "pay" && (
          <form onSubmit={handleSubmitRequest} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-2xl flex items-center justify-between border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Selected Plan</span>
                <p className="font-extrabold text-sm text-foreground">
                  {selectedPack.tokens} Tokens Package
                </p>
                {appliedCoupon && (
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    🎟️ {appliedCoupon.code} applied (-₹{couponDiscount})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Amount</span>
                <div className="flex items-baseline justify-end gap-1.5">
                  {couponDiscount > 0 && (
                    <span className="text-xs line-through text-muted-foreground">
                      ₹{selectedPack.price}
                    </span>
                  )}
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ₹{effectivePrice}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 border-2 border-emerald-500/40 rounded-3xl space-y-3 shadow-md">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <QrCode className="size-4 text-emerald-600" />
                Scan to Pay ₹{effectivePrice} via Any UPI App
              </p>

              <div className="p-2 bg-white rounded-2xl shadow-md border-2 border-emerald-500/50 flex flex-col items-center">
                <Image
                  src={UPI_PAYMENT_CONFIG.qrImage}
                  alt="UPI QR Code"
                  width={200}
                  height={200}
                  className="rounded-xl object-contain shadow-sm"
                />
              </div>

              <div className="w-full flex items-center justify-between gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="min-w-0 flex-1 pl-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">UPI ID</p>
                  <p className="text-xs font-mono font-bold text-foreground truncate select-all">
                    {UPI_PAYMENT_CONFIG.vpa}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-bold gap-1 rounded-lg shrink-0 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600"
                  onClick={handleCopyUpi}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              {/* Direct UPI App trigger on mobile */}
              <a
                href={`upi://pay?pa=${UPI_PAYMENT_CONFIG.vpa}&pn=${encodeURIComponent(
                  UPI_PAYMENT_CONFIG.name
                )}&am=${selectedPack.price}&cu=INR&tn=BhoomiTayi%20Tokens`}
                className="w-full text-center py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                📲 Click to Open UPI App (GPay / PhonePe / Paytm)
              </a>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <Label htmlFor="notes" className="text-xs font-bold">
                  Sender UPI Name / Mobile Number *
                </Label>
                <Input
                  id="notes"
                  placeholder="e.g. John Doe / 9876543210"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 rounded-xl h-10 border-zinc-300 dark:border-zinc-700"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="txnId" className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>Optional UPI ID / UTR</span>
                </Label>
                <Input
                  id="txnId"
                  placeholder="e.g. 423987123456"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="mt-1 font-mono rounded-xl h-9 text-xs border-zinc-300 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl h-11"
                onClick={() => setStep("select")}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-[2] rounded-xl h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "I Have Paid • Submit"}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Submitted Confirmation */}
        {step === "submitted" && (
          <div className="p-6 text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="size-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">
                Payment Request Submitted!
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xs mx-auto">
                Thank you! Your request for <span className="font-bold text-foreground">{selectedPack.tokens} BhoomiTayi Tokens</span> (₹{selectedPack.price}) has been sent to our admin team.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl text-left flex items-start gap-2.5">
              <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Tokens will be credited automatically once the admin verifies the payment transaction (usually within a few minutes).
              </p>
            </div>

            <Button
              className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold h-11"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
