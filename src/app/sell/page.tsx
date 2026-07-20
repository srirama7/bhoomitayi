"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Home,
  Mountain,
  Bed,
  Building2,
  Car,
  Package,
  Phone,
  Mail,
  ChevronRight,
  Check,
  Info,
  Upload,
  X,
  ZoomIn,
  MapPin,
  Loader2,
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import { formatPhoneWithCountryCode } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import { db, storage } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { validateImage, validateImageCount } from "@/lib/image-upload";
import { PaymentGateway } from "@/components/listings/upi-payment-dialog";
import { LISTING_FEE } from "@/lib/listing-timer";

type PropertyCategory = "house" | "land" | "pg" | "commercial" | "vehicle" | "commodity";
type TransactionType = "sell" | "rent" | "commercial_lease";

const CATEGORY_OPTIONS = [
  { value: "house" as const, label: "House / Apartment", Icon: Home, emoji: "🏡" },
  { value: "land" as const, label: "Land / Plot", Icon: Mountain, emoji: "🌍" },
  { value: "pg" as const, label: "PG / Hostel", Icon: Bed, emoji: "🛏️" },
  { value: "commercial" as const, label: "Commercial", Icon: Building2, emoji: "🏢" },
  { value: "vehicle" as const, label: "Vehicle", Icon: Car, emoji: "🚗" },
  { value: "commodity" as const, label: "Other Commodity", Icon: Package, emoji: "📦" },
];

const TRANSACTION_OPTIONS: Record<PropertyCategory, { value: TransactionType; label: string }[]> = {
  house: [
    { value: "sell", label: "Sell" },
    { value: "rent", label: "Rent" },
  ],
  land: [
    { value: "sell", label: "Sell" },
  ],
  pg: [
    { value: "rent", label: "Rent" },
  ],
  commercial: [
    { value: "sell", label: "Sell" },
    { value: "rent", label: "Rent" },
    { value: "commercial_lease", label: "Lease" },
  ],
  vehicle: [
    { value: "sell", label: "Sell" },
  ],
  commodity: [
    { value: "sell", label: "Sell" },
  ],
};

const STEPS = [
  "Service Type",
  "Service Details",
  "Preview & Submit",
];

export default function SellPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <SellPageContent />
    </Suspense>
  );
}

function SellPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setRedirecting(true);
      router.replace("/auth/login?redirectTo=/sell");
    }
  }, [user, loading, router]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingListingData, setPendingListingData] = useState<Record<string, unknown> | null>(null);

  // Step 1: Service Type
  const [category, setCategory] = useState<PropertyCategory | "">("");
  const [transactionType, setTransactionType] = useState<TransactionType | "">("");

  // Step 2: Service Details (unified for all categories)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [ownerPhone, setOwnerPhone] = useState(profile?.phone || "");
  const [ownerEmail, setOwnerEmail] = useState(user?.email || "");

  // Update contact details when profile loads
  useEffect(() => {
    if (profile?.phone && !ownerPhone) setOwnerPhone(profile.phone);
    if (user?.email && !ownerEmail) setOwnerEmail(user.email);
  }, [profile, user, ownerPhone, ownerEmail]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const countError = validateImageCount(images.length, files.length);
    if (countError) {
      toast.error(countError);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...validFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const countError = validateImageCount(images.length, files.length);
    if (countError) {
      toast.error(countError);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...validFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  }

  function validateStep(): boolean {
    switch (step) {
      case 0:
        if (!category) { toast.error("Please select a service category"); return false; }
        if (!transactionType) { toast.error("Please select a transaction type"); return false; }
        return true;
      case 1:
        if (!title.trim()) { toast.error("Please enter a title"); return false; }
        if (title.length > 120) { toast.error("Title must be 120 characters or less"); return false; }
        if (!description.trim()) { toast.error("Please enter a description"); return false; }
        if (!address.trim()) { toast.error("Please enter an address"); return false; }
        if (!ownerPhone.trim() || !/^\d{10}$/.test(ownerPhone)) { toast.error("Please enter a valid 10-digit phone number"); return false; }
        if (!ownerEmail.trim()) { toast.error("Please enter your email"); return false; }
        if (images.length < 1) { toast.error("Please upload at least 1 photo"); return false; }
        return true;
      default:
        return true;
    }
  }

  function handleNext() {
    if (validateStep()) setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handlePrevious() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmit() {
    if (!user) {
      toast.error("You must be logged in to create a listing");
      return;
    }

    setSubmitting(true);

    try {
      // Upload images to Firebase Storage
      const imageUrls: string[] = [];
      for (const file of images) {
        const storageRef = ref(storage, `listings/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      // Map transaction type for storage
      const dbTransactionType = transactionType === "commercial_lease" ? "rent" : transactionType;

      // Store listing data and show payment dialog
      setPendingListingData({
        user_id: user.uid,
        category,
        transaction_type: dbTransactionType,
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        images: imageUrls,
        owner_phone: formatPhoneWithCountryCode(ownerPhone.trim()),
        owner_email: ownerEmail.trim(),
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setShowPaymentDialog(true);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentConfirmed(plan?: any) {
    if (!pendingListingData) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "listings"), {
        ...pendingListingData,
        payment_amount: plan?.price !== undefined ? plan.price : LISTING_FEE,
        booster_plan: plan?.name || "Basic",
        plan_days: plan?.days || 30,
        payment_status: plan?.price === 0 ? "not_required" : "pending",
        payment_reason: "initial_listing",
        reactivation_count: 0,
        last_payment_submitted_at: new Date().toISOString(),
        status: "pending_payment",
      });

      setShowPaymentDialog(false);
      setPendingListingData(null);
      toast.success(
        plan?.price === 0
          ? "Listing submitted! It will go live after admin approval."
          : "Listing submitted! It will go live after admin verifies your payment."
      );
      router.push("/dashboard/my-listings");
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user || redirecting) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="size-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Please log in to register your service</p>
          <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
        </div>
      </main>
    );
  }

  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.value === category);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50/80 via-white to-pink-50/80 dark:from-zinc-950 dark:via-zinc-900/90 dark:to-zinc-950 relative overflow-hidden">
      {/* Ambient background blur elements */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-pink-400/10 dark:bg-pink-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      {/* Page Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-pink-600 dark:from-orange-900/50 dark:to-pink-900/50 border-b border-orange-500/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/4 h-64 w-64 -translate-y-1/2 rounded-full bg-orange-400/30 blur-3xl mix-blend-overlay" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-pink-300/30 blur-3xl mix-blend-overlay" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-white border border-white/30 mb-6 shadow-xl">
            <Sparkles className="size-4" />
            For Service Providers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 drop-shadow-sm">
            Register Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-pink-100">
              Service
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-orange-50 text-lg">
            Just 3 simple steps to connect with thousands of potential clients across BhoomiTayi.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center size-9 rounded-full text-sm font-semibold transition-colors ${
                    i < step
                      ? "bg-orange-600 text-white"
                      : i === step
                        ? "bg-orange-600 text-white ring-4 ring-orange-100 dark:ring-orange-900"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="size-5" /> : i + 1}
                </div>
                <span className="hidden sm:block text-xs mt-1.5 text-muted-foreground text-center max-w-[100px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Service Type */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="rounded-[2rem] border-0 shadow-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent p-8 border-b border-orange-500/10">
                <CardTitle className="text-2xl font-bold">What type of service are you registering?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="space-y-4">
                  <Label className="text-lg text-muted-foreground">Service Category</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setCategory(cat.value);
                          setTransactionType("");
                        }}
                        className={`group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                          category === cat.value
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 shadow-lg shadow-orange-500/20 scale-[1.02]"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className={`p-4 rounded-full transition-colors ${category === cat.value ? "bg-orange-100 dark:bg-orange-800" : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20"}`}>
                          <cat.Icon className={`size-8 ${category === cat.value ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`} />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-bold block mb-1">{cat.label}</span>
                          <span className="text-lg">{cat.emoji}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {category && (
                  <div className="space-y-3">
                    <Label>What do you want to do?</Label>
                    <div className="flex flex-wrap gap-3">
                      {TRANSACTION_OPTIONS[category].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTransactionType(opt.value)}
                          className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${
                            transactionType === opt.value
                              ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-muted-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Service Details */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="rounded-[2rem] border-0 shadow-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent p-8 border-b border-orange-500/10">
                <CardTitle className="text-2xl font-bold">
                  {selectedCategory && (
                    <span className="mr-2">{selectedCategory.emoji}</span>
                  )}
                  Service Details
                </CardTitle>
                {selectedCategory && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCategory.label} · <span className="capitalize">{transactionType === "commercial_lease" ? "Lease" : transactionType}</span>
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-1.5">
                    <FileText className="size-4 text-muted-foreground" />
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    placeholder={`e.g. ${selectedCategory?.value === "house" ? "Spacious 3BHK in Koramangala" : selectedCategory?.value === "land" ? "30x40 Corner Plot near Ring Road" : selectedCategory?.value === "pg" ? "Fully furnished PG near Metro" : selectedCategory?.value === "commercial" ? "Prime Office Space in CBD" : selectedCategory?.value === "vehicle" ? "Well-maintained Honda City 2020" : "Brand new Samsung TV for sale"}`}
                  />
                  <p className="text-xs text-muted-foreground">{title.length}/120</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-1.5">
                    <FileText className="size-4 text-muted-foreground" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Describe your service in detail — include important features, condition, nearby landmarks, and anything that makes it special..."
                  />
                  <p className="text-xs text-muted-foreground">{description.length}/2000</p>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1.5">
                    <MapPin className="size-4 text-muted-foreground" />
                    Address / Location
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address or area (e.g. JP Nagar, Bangalore)"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="ownerPhone" className="flex items-center gap-1.5">
                    <Phone className="size-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="ownerPhone"
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    maxLength={10}
                    placeholder="10-digit mobile number"
                  />
                  <p className="text-xs text-muted-foreground">Buyers will use this to contact you.</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail" className="flex items-center gap-1.5">
                    <Mail className="size-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                {/* Photos */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-1.5">
                    <ImageIcon className="size-4 text-muted-foreground" />
                    Photos <span className="text-xs text-muted-foreground ml-1">(1–4 images)</span>
                  </Label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center size-14 rounded-2xl bg-orange-50 dark:bg-orange-950/30">
                        <ImageIcon className="size-7 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Drop photos here or click to upload</p>
                        <p className="text-sm text-muted-foreground mt-1">JPG, PNG, or WebP. Max 5 MB each. {images.length}/4 uploaded.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2">
                        <Upload className="size-4 mr-1.5" />
                        Choose Photos
                      </Button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border aspect-square">
                          <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full size-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="size-3.5" />
                          </button>
                          {i === 0 && (
                            <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Preview & Submit */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="rounded-[2rem] border-0 shadow-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent p-8 border-b border-orange-500/10">
                <CardTitle className="text-2xl font-bold">Preview & Submit</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Review your listing before submitting.</p>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                {/* Service Type */}
                <div className="rounded-xl bg-muted/50 p-5 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Service Type</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCategory?.emoji}</span>
                    <div>
                      <p className="font-semibold">{selectedCategory?.label}</p>
                      <p className="text-sm text-muted-foreground capitalize">{transactionType === "commercial_lease" ? "Lease" : transactionType}</p>
                    </div>
                  </div>
                </div>

                {/* Listing Details */}
                <div className="rounded-xl bg-muted/50 p-5 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Listing Details</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Title</p>
                      <p className="font-semibold text-base">{title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Description</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p>{address}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="rounded-xl bg-muted/50 p-5 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground shrink-0" />
                      <p className="font-medium">{ownerPhone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground shrink-0" />
                      <p className="font-medium">{ownerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Photos Preview */}
                {previews.length > 0 && (
                  <div className="rounded-xl bg-muted/50 p-5 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Photos ({images.length})
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {previews.map((src, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden aspect-square border">
                          <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded font-medium">
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready notice */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30">
                  <CheckCircle2 className="size-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-orange-800 dark:text-orange-400">Ready to submit!</p>
                    <p className="text-orange-700/80 dark:text-orange-400/70 mt-0.5">
                      Your listing will go live after admin approval. Interested buyers will contact you via phone or email.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} disabled={step === 0} className="gap-1.5">
            <ArrowLeft className="size-4" />
            Previous
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white">
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white">
              {submitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Submit Listing
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <PaymentGateway
        open={showPaymentDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowPaymentDialog(false);
            setPendingListingData(null);
          }
        }}
        onPaymentConfirmed={handlePaymentConfirmed}
        submitting={submitting}
      />
    </main>
  );
}
