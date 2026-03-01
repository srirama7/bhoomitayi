"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Home,
  Mountain,
  Bed,
  Building2,
  Car,
  Package,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ImageIcon,
  User,
  Phone,
  Mail,
  IndianRupee,
  ShieldCheck,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/store";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { validateImage, validateImageCount } from "@/lib/image-upload";
import {
  FURNISHING_OPTIONS,
  LAND_TYPES,
  FACING_OPTIONS,
  GENDER_OPTIONS,
  OCCUPANCY_OPTIONS,
  COMMERCIAL_TYPES,
  VEHICLE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  COMMODITY_TYPES,
  CONDITION_OPTIONS,
  INDIAN_STATES,
} from "@/lib/constants";

const SERVICE_FEE = 20;

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
  "Location & Images",
  "Personal Details",
  "Payment",
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

  // Step 1: Service Type
  const [category, setCategory] = useState<PropertyCategory | "">("");
  const [transactionType, setTransactionType] = useState<TransactionType | "">("");

  // Step 2: Service Details (varies by category)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  // House-specific
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [areaSqft, setAreaSqft] = useState<number | "">("");
  const [furnishing, setFurnishing] = useState("");
  const [floors, setFloors] = useState<number | "">("");
  const [parking, setParking] = useState(false);
  const [yearBuilt, setYearBuilt] = useState<number | "">("");
  const [amenities, setAmenities] = useState("");
  // Land-specific
  const [landType, setLandType] = useState("");
  const [facing, setFacing] = useState("");
  const [roadWidthFt, setRoadWidthFt] = useState<number | "">("");
  const [boundaryWall, setBoundaryWall] = useState(false);
  const [isCornerPlot, setIsCornerPlot] = useState(false);
  // PG-specific
  const [securityDeposit, setSecurityDeposit] = useState<number | "">("");
  const [genderPreference, setGenderPreference] = useState("");
  const [occupancyType, setOccupancyType] = useState("");
  const [mealsIncluded, setMealsIncluded] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [ac, setAc] = useState(false);
  const [attachedBathroom, setAttachedBathroom] = useState(false);
  const [pgRules, setPgRules] = useState("");
  // Commercial-specific
  const [commercialType, setCommercialType] = useState("");
  const [powerBackup, setPowerBackup] = useState(false);
  const [lift, setLift] = useState(false);
  // Vehicle-specific
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState<number | "">("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [kmDriven, setKmDriven] = useState<number | "">("");
  const [ownerNumber, setOwnerNumber] = useState<number | "">("");
  const [registrationState, setRegistrationState] = useState("");
  const [insuranceValid, setInsuranceValid] = useState(false);
  // Commodity-specific
  const [commodityType, setCommodityType] = useState("");
  const [commodityBrand, setCommodityBrand] = useState("");
  const [commodityCondition, setCommodityCondition] = useState("");
  const [warranty, setWarranty] = useState(false);
  const [ageMonths, setAgeMonths] = useState<number | "">("");

  // Step 3: Location
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  // Step 4: Personal Details
  const [ownerName, setOwnerName] = useState(profile?.full_name || "");
  const [ownerPhone, setOwnerPhone] = useState(profile?.phone || "");
  const [ownerEmail, setOwnerEmail] = useState(user?.email || "");

  // Step 5: Payment
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [payingNow, setPayingNow] = useState(false);
  const searchParams = useSearchParams();

  // Handle Cashfree redirect after payment
  useEffect(() => {
    const orderId = searchParams.get("order_id");
    const status = searchParams.get("status");
    if (orderId && status === "PAID") {
      // Verify payment on server
      fetch("/api/cashfree/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.orderStatus === "PAID") {
            setPaymentId(data.orderId);
            setPaymentDone(true);
            setStep(4);
            toast.success("Payment successful! You can now submit your property listing.");
          } else {
            toast.error("Payment verification failed. Please try again.");
          }
        })
        .catch(() => {
          toast.error("Could not verify payment. Please contact support.");
        });
      // Clean the URL params
      window.history.replaceState({}, "", "/sell");
    }
  }, [searchParams]);

  // Update personal details when profile loads
  useEffect(() => {
    if (profile?.full_name && !ownerName) setOwnerName(profile.full_name);
    if (profile?.phone && !ownerPhone) setOwnerPhone(profile.phone);
    if (user?.email && !ownerEmail) setOwnerEmail(user.email);
  }, [profile, user, ownerName, ownerPhone, ownerEmail]);

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
        if (!price || Number(price) <= 0) { toast.error("Please enter a valid price"); return false; }
        if (category === "house") {
          if (!bedrooms || Number(bedrooms) < 1) { toast.error("Please enter number of bedrooms"); return false; }
          if (!bathrooms || Number(bathrooms) < 1) { toast.error("Please enter number of bathrooms"); return false; }
          if (!areaSqft || Number(areaSqft) <= 0) { toast.error("Please enter area in sq.ft"); return false; }
          if (!furnishing) { toast.error("Please select furnishing"); return false; }
        }
        if (category === "land") {
          if (!areaSqft || Number(areaSqft) <= 0) { toast.error("Please enter area in sq.ft"); return false; }
          if (!landType) { toast.error("Please select land type"); return false; }
        }
        if (category === "pg") {
          if (!genderPreference) { toast.error("Please select gender preference"); return false; }
          if (!occupancyType) { toast.error("Please select occupancy type"); return false; }
        }
        if (category === "commercial") {
          if (!commercialType) { toast.error("Please select commercial type"); return false; }
          if (!areaSqft || Number(areaSqft) <= 0) { toast.error("Please enter area in sq.ft"); return false; }
        }
        if (category === "vehicle") {
          if (!vehicleType) { toast.error("Please select vehicle type"); return false; }
          if (!vehicleBrand.trim()) { toast.error("Please enter vehicle brand"); return false; }
          if (!vehicleModel.trim()) { toast.error("Please enter vehicle model"); return false; }
          if (!vehicleYear || Number(vehicleYear) < 1900) { toast.error("Please enter a valid year"); return false; }
        }
        if (category === "commodity") {
          if (!commodityType) { toast.error("Please select commodity type"); return false; }
          if (!commodityCondition) { toast.error("Please select condition"); return false; }
        }
        return true;
      case 2:
        if (!address.trim()) { toast.error("Please enter an address"); return false; }
        if (!pincode.trim() || !/^\d{6}$/.test(pincode)) { toast.error("Please enter a valid 6-digit pincode"); return false; }
        if (images.length < 1) { toast.error("Please upload at least 1 image"); return false; }
        return true;
      case 3:
        if (!ownerName.trim()) { toast.error("Please enter your name"); return false; }
        if (!ownerPhone.trim() || !/^\d{10}$/.test(ownerPhone)) { toast.error("Please enter a valid 10-digit phone number"); return false; }
        if (!ownerEmail.trim()) { toast.error("Please enter your email"); return false; }
        return true;
      case 4:
        if (!paymentDone) { toast.error("Please complete the listing fee payment of ₹" + SERVICE_FEE + " to publish your property"); return false; }
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

  const handleCashfreePayment = useCallback(async () => {
    if (!user) return;
    setPayingNow(true);

    try {
      const res = await fetch("/api/cashfree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: SERVICE_FEE,
          customerName: ownerName,
          customerEmail: ownerEmail,
          customerPhone: ownerPhone,
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const { paymentSessionId } = await res.json();

      // Load Cashfree JS SDK dynamically
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cashfree = (window as any).Cashfree({ mode: "production" });
        cashfree.checkout({
          paymentSessionId,
          redirectTarget: "_self",
        });
      };
      script.onerror = () => {
        toast.error("Could not load payment gateway. Please try again.");
        setPayingNow(false);
      };
      document.body.appendChild(script);
    } catch {
      toast.error("Could not initiate payment. Please try again.");
      setPayingNow(false);
    }
  }, [user, ownerName, ownerEmail, ownerPhone]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Remove undefined values from an object (Firestore rejects undefined)
  function cleanObject(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) cleaned[key] = value;
    }
    return cleaned;
  }

  async function handleSubmit() {
    if (!user) {
      toast.error("You must be logged in to create a listing");
      return;
    }

    setSubmitting(true);

    try {
      // Convert images to base64 data URLs and store directly in Firestore
      // This is fast and doesn't depend on Firebase Storage being set up
      const base64Promises = images.map((file) => fileToBase64(file));
      const imageUrls = await Promise.all(base64Promises);

      // Build category-specific details
      let details: Record<string, unknown> = {};

      if (category === "house") {
        details = cleanObject({
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          area_sqft: Number(areaSqft),
          furnishing,
          floors: floors ? Number(floors) : undefined,
          parking,
          year_built: yearBuilt ? Number(yearBuilt) : undefined,
          amenities: amenities ? amenities.split(",").map((a) => a.trim()).filter(Boolean) : undefined,
        });
      } else if (category === "land") {
        details = cleanObject({
          area_sqft: Number(areaSqft),
          land_type: landType,
          facing: facing || undefined,
          road_width_ft: roadWidthFt ? Number(roadWidthFt) : undefined,
          boundary_wall: boundaryWall,
          is_corner_plot: isCornerPlot,
        });
      } else if (category === "pg") {
        details = cleanObject({
          rent_per_month: Number(price),
          security_deposit: securityDeposit ? Number(securityDeposit) : undefined,
          gender_preference: genderPreference,
          occupancy_type: occupancyType,
          meals_included: mealsIncluded,
          wifi,
          ac,
          attached_bathroom: attachedBathroom,
          rules: pgRules || undefined,
        });
      } else if (category === "commercial") {
        details = cleanObject({
          commercial_type: commercialType,
          area_sqft: Number(areaSqft),
          furnishing: furnishing || undefined,
          floors: floors ? Number(floors) : undefined,
          parking,
          power_backup: powerBackup,
          lift,
        });
      } else if (category === "vehicle") {
        details = cleanObject({
          vehicle_type: vehicleType,
          brand: vehicleBrand.trim(),
          model: vehicleModel.trim(),
          year: Number(vehicleYear),
          fuel_type: fuelType || undefined,
          transmission: transmission || undefined,
          km_driven: kmDriven ? Number(kmDriven) : undefined,
          owner_number: ownerNumber ? Number(ownerNumber) : undefined,
          registration_state: registrationState || undefined,
          insurance_valid: insuranceValid,
        });
      } else if (category === "commodity") {
        details = cleanObject({
          commodity_type: commodityType,
          brand: commodityBrand.trim() || undefined,
          condition: commodityCondition,
          warranty,
          age_months: ageMonths ? Number(ageMonths) : undefined,
        });
      }

      // Map transaction type for storage
      const dbTransactionType = transactionType === "commercial_lease" ? "rent" : transactionType;

      await addDoc(collection(db, "listings"), {
        user_id: user.uid,
        category,
        transaction_type: dbTransactionType,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        address: address.trim(),
        pincode: pincode.trim(),
        images: imageUrls,
        details,
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim(),
        owner_email: ownerEmail.trim(),
        payment_id: paymentId,
        payment_amount: SERVICE_FEE,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast.success("Listing created successfully!");
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
          <div className="size-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user || redirecting) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="size-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Please log in to register your service</p>
          <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
        </div>
      </main>
    );
  }

  const priceLabel = transactionType === "rent" || transactionType === "commercial_lease"
    ? "Rent per Month (INR)"
    : "Price (INR)";

  return (
    <main className="min-h-screen bg-background">
      {/* Page Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-green-50 via-emerald-50/50 to-background dark:from-green-950/30 dark:via-emerald-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-green-200/20 dark:bg-green-800/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 h-60 w-60 rounded-full bg-emerald-200/20 dark:bg-emerald-800/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-950/40 px-4 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/50 mb-4">
            <Sparkles className="size-4" />
            For Service Providers
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
            Register Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
              Service
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Fill in the details below to register your service. We will connect you with thousands of potential clients.
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
                      ? "bg-green-600 text-white"
                      : i === step
                        ? "bg-green-600 text-white ring-4 ring-green-100 dark:ring-green-900"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="size-5" /> : i + 1}
                </div>
                <span className="hidden sm:block text-xs mt-1.5 text-muted-foreground text-center max-w-[80px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Service Type */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>What type of service are you registering?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Service Category</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setCategory(cat.value);
                          setTransactionType("");
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          category === cat.value
                            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <cat.Icon className={`size-6 ${category === cat.value ? "text-green-600" : "text-muted-foreground"}`} />
                        <div>
                          <span className="text-sm font-medium">{cat.label}</span>
                          <span className="ml-1.5">{cat.emoji}</span>
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
                              ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
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
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Spacious 3BHK in Andheri West" />
                  <p className="text-xs text-muted-foreground">{title.length}/120</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder="Describe your service in detail..." />
                  <p className="text-xs text-muted-foreground">{description.length}/2000</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">{priceLabel}</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")} min={0} placeholder="Enter amount" />
                </div>

                {/* House-specific fields */}
                {category === "house" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input id="bedrooms" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : "")} min={1} max={20} placeholder="1-20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input id="bathrooms" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : "")} min={1} max={10} placeholder="1-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area">Area (sq.ft)</Label>
                      <Input id="area" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value ? Number(e.target.value) : "")} min={1} placeholder="Enter area" />
                    </div>
                    <div className="space-y-2">
                      <Label>Furnishing</Label>
                      <Select value={furnishing} onValueChange={setFurnishing}>
                        <SelectTrigger><SelectValue placeholder="Select furnishing" /></SelectTrigger>
                        <SelectContent>
                          {FURNISHING_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="floors">Floors</Label>
                        <Input id="floors" type="number" value={floors} onChange={(e) => setFloors(e.target.value ? Number(e.target.value) : "")} min={1} placeholder="Optional" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearBuilt">Year Built</Label>
                        <Input id="yearBuilt" type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value ? Number(e.target.value) : "")} min={1900} max={new Date().getFullYear()} placeholder="e.g. 2020" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="parking" checked={parking} onCheckedChange={setParking} />
                      <Label htmlFor="parking">Parking Available</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amenities">Amenities</Label>
                      <Input id="amenities" value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="Gym, Swimming Pool, Garden (comma-separated)" />
                    </div>
                  </>
                )}

                {/* Land-specific fields */}
                {category === "land" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="landArea">Area (sq.ft)</Label>
                      <Input id="landArea" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value ? Number(e.target.value) : "")} min={1} placeholder="Enter area" />
                    </div>
                    <div className="space-y-2">
                      <Label>Land Type</Label>
                      <Select value={landType} onValueChange={setLandType}>
                        <SelectTrigger><SelectValue placeholder="Select land type" /></SelectTrigger>
                        <SelectContent>
                          {LAND_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Facing</Label>
                        <Select value={facing} onValueChange={setFacing}>
                          <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                          <SelectContent>
                            {FACING_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roadWidth">Road Width (ft)</Label>
                        <Input id="roadWidth" type="number" value={roadWidthFt} onChange={(e) => setRoadWidthFt(e.target.value ? Number(e.target.value) : "")} min={1} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3">
                        <Switch id="boundaryWall" checked={boundaryWall} onCheckedChange={setBoundaryWall} />
                        <Label htmlFor="boundaryWall">Boundary Wall</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="cornerPlot" checked={isCornerPlot} onCheckedChange={setIsCornerPlot} />
                        <Label htmlFor="cornerPlot">Corner Plot</Label>
                      </div>
                    </div>
                  </>
                )}

                {/* PG-specific fields */}
                {category === "pg" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="securityDeposit">Security Deposit (INR)</Label>
                      <Input id="securityDeposit" type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value ? Number(e.target.value) : "")} min={0} placeholder="Optional" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Gender Preference</Label>
                        <Select value={genderPreference} onValueChange={setGenderPreference}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {GENDER_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Occupancy Type</Label>
                        <Select value={occupancyType} onValueChange={setOccupancyType}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {OCCUPANCY_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3">
                        <Switch id="meals" checked={mealsIncluded} onCheckedChange={setMealsIncluded} />
                        <Label htmlFor="meals">Meals Included</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="wifi" checked={wifi} onCheckedChange={setWifi} />
                        <Label htmlFor="wifi">WiFi</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="ac" checked={ac} onCheckedChange={setAc} />
                        <Label htmlFor="ac">AC</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="attachedBath" checked={attachedBathroom} onCheckedChange={setAttachedBathroom} />
                        <Label htmlFor="attachedBath">Attached Bathroom</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pgRules">House Rules</Label>
                      <Textarea id="pgRules" value={pgRules} onChange={(e) => setPgRules(e.target.value)} rows={3} placeholder="Any rules for tenants (optional)" />
                    </div>
                  </>
                )}

                {/* Commercial-specific fields */}
                {category === "commercial" && (
                  <>
                    <div className="space-y-2">
                      <Label>Commercial Type</Label>
                      <Select value={commercialType} onValueChange={setCommercialType}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {COMMERCIAL_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commArea">Area (sq.ft)</Label>
                      <Input id="commArea" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value ? Number(e.target.value) : "")} min={1} placeholder="Enter area" />
                    </div>
                    <div className="space-y-2">
                      <Label>Furnishing</Label>
                      <Select value={furnishing} onValueChange={setFurnishing}>
                        <SelectTrigger><SelectValue placeholder="Select furnishing" /></SelectTrigger>
                        <SelectContent>
                          {FURNISHING_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commFloors">Floors</Label>
                      <Input id="commFloors" type="number" value={floors} onChange={(e) => setFloors(e.target.value ? Number(e.target.value) : "")} min={1} placeholder="Optional" />
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3">
                        <Switch id="commParking" checked={parking} onCheckedChange={setParking} />
                        <Label htmlFor="commParking">Parking</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="powerBackup" checked={powerBackup} onCheckedChange={setPowerBackup} />
                        <Label htmlFor="powerBackup">Power Backup</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="lift" checked={lift} onCheckedChange={setLift} />
                        <Label htmlFor="lift">Lift</Label>
                      </div>
                    </div>
                  </>
                )}

                {/* Vehicle-specific fields */}
                {category === "vehicle" && (
                  <>
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleBrand">Brand</Label>
                        <Input id="vehicleBrand" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="e.g. Honda, Maruti" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleModel">Model</Label>
                        <Input id="vehicleModel" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="e.g. City, Swift" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleYear">Year</Label>
                        <Input id="vehicleYear" type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value ? Number(e.target.value) : "")} min={1900} max={new Date().getFullYear()} placeholder="e.g. 2022" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kmDriven">KM Driven</Label>
                        <Input id="kmDriven" type="number" value={kmDriven} onChange={(e) => setKmDriven(e.target.value ? Number(e.target.value) : "")} min={0} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fuel Type</Label>
                        <Select value={fuelType} onValueChange={setFuelType}>
                          <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                          <SelectContent>
                            {FUEL_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Transmission</Label>
                        <Select value={transmission} onValueChange={setTransmission}>
                          <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                          <SelectContent>
                            {TRANSMISSION_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ownerNumber">Owner Number</Label>
                        <Input id="ownerNumber" type="number" value={ownerNumber} onChange={(e) => setOwnerNumber(e.target.value ? Number(e.target.value) : "")} min={1} max={10} placeholder="e.g. 1, 2" />
                      </div>
                      <div className="space-y-2">
                        <Label>Registration State</Label>
                        <Select value={registrationState} onValueChange={setRegistrationState}>
                          <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="insuranceValid" checked={insuranceValid} onCheckedChange={setInsuranceValid} />
                      <Label htmlFor="insuranceValid">Insurance Valid</Label>
                    </div>
                  </>
                )}

                {/* Commodity-specific fields */}
                {category === "commodity" && (
                  <>
                    <div className="space-y-2">
                      <Label>Commodity Type</Label>
                      <Select value={commodityType} onValueChange={setCommodityType}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {COMMODITY_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commodityBrand">Brand (Optional)</Label>
                      <Input id="commodityBrand" value={commodityBrand} onChange={(e) => setCommodityBrand(e.target.value)} placeholder="e.g. Samsung, IKEA" />
                    </div>
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select value={commodityCondition} onValueChange={setCommodityCondition}>
                        <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ageMonths">Age (months, optional)</Label>
                      <Input id="ageMonths" type="number" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value ? Number(e.target.value) : "")} min={0} placeholder="How old is the item?" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="warranty" checked={warranty} onCheckedChange={setWarranty} />
                      <Label htmlFor="warranty">Warranty Available</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Location & Images */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Location & Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter full address" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} placeholder="6-digit pincode" />
                </div>

                <div className="space-y-3">
                  <Label>Images (1-4)</Label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center size-14 rounded-2xl bg-green-50 dark:bg-green-950/30">
                        <ImageIcon className="size-7 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Drop images here or click to upload</p>
                        <p className="text-sm text-muted-foreground mt-1">JPG, PNG, or WebP. Max 5 MB each. {images.length}/4 uploaded.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2">
                        <Upload className="size-4 mr-1.5" />
                        Choose Files
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border">
                          <img src={src} alt={`Preview ${i + 1}`} className="w-full h-28 object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full size-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Personal Details */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Your Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  These details will be shown to interested buyers/renters so they can contact you.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="flex items-center gap-1.5">
                    <User className="size-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Your full name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPhone" className="flex items-center gap-1.5">
                    <Phone className="size-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input id="ownerPhone" type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} maxLength={10} placeholder="10-digit phone number" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail" className="flex items-center gap-1.5">
                    <Mail className="size-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input id="ownerEmail" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="your@email.com" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Payment */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="size-5 text-green-600" />
                  Property Listing Fee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="size-5 text-green-600" />
                    <p className="font-semibold text-green-800 dark:text-green-300">One-time listing fee</p>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    A small listing fee of <span className="font-bold text-lg">&#8377;{SERVICE_FEE}</span> is required to publish your property listing. This helps us maintain quality listings on BhoomiTayi.
                  </p>
                </div>

                {paymentDone ? (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-950/50">
                      <CheckCircle2 className="size-8 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">Payment Successful!</p>
                      <p className="text-sm text-muted-foreground mt-1">Transaction ID: {paymentId}</p>
                      <p className="text-sm text-muted-foreground">Amount: &#8377;{SERVICE_FEE}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Click &quot;Next&quot; to review and submit your property listing.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5 py-4">
                    <div className="flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
                      <CreditCard className="size-10 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">&#8377;{SERVICE_FEE}</p>
                      <p className="text-sm text-muted-foreground mt-1">Pay securely via Cashfree</p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleCashfreePayment}
                      disabled={payingNow}
                      className="gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-600/20 px-8 text-base"
                    >
                      {payingNow ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <IndianRupee className="size-5" />
                          Pay &#8377;{SERVICE_FEE} Listing Fee
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                      Secure payment powered by Cashfree. UPI &amp; other methods available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 6: Preview & Submit */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Review Your Listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Type */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Service Type</h3>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-medium capitalize">{category}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Transaction</dt>
                      <dd className="font-medium capitalize">{transactionType === "commercial_lease" ? "Lease" : transactionType}</dd>
                    </div>
                  </dl>
                </div>

                {/* Basic Details */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Basic Details</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Title</dt>
                      <dd className="font-medium">{title}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Description</dt>
                      <dd className="font-medium whitespace-pre-wrap text-muted-foreground">{description}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{priceLabel}</dt>
                      <dd className="font-medium">{Number(price).toLocaleString("en-IN")}</dd>
                    </div>
                  </dl>
                </div>

                {/* Category-specific details */}
                {category === "house" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">House Details</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">Bedrooms</dt><dd className="font-medium">{bedrooms}</dd></div>
                      <div><dt className="text-muted-foreground">Bathrooms</dt><dd className="font-medium">{bathrooms}</dd></div>
                      <div><dt className="text-muted-foreground">Area</dt><dd className="font-medium">{areaSqft} sq.ft</dd></div>
                      <div><dt className="text-muted-foreground">Furnishing</dt><dd className="font-medium capitalize">{FURNISHING_OPTIONS.find(o => o.value === furnishing)?.label || furnishing}</dd></div>
                      {floors && <div><dt className="text-muted-foreground">Floors</dt><dd className="font-medium">{floors}</dd></div>}
                      <div><dt className="text-muted-foreground">Parking</dt><dd className="font-medium">{parking ? "Yes" : "No"}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "land" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Land Details</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">Area</dt><dd className="font-medium">{areaSqft} sq.ft</dd></div>
                      <div><dt className="text-muted-foreground">Land Type</dt><dd className="font-medium capitalize">{LAND_TYPES.find(o => o.value === landType)?.label || landType}</dd></div>
                      {facing && <div><dt className="text-muted-foreground">Facing</dt><dd className="font-medium capitalize">{facing}</dd></div>}
                      <div><dt className="text-muted-foreground">Boundary Wall</dt><dd className="font-medium">{boundaryWall ? "Yes" : "No"}</dd></div>
                      <div><dt className="text-muted-foreground">Corner Plot</dt><dd className="font-medium">{isCornerPlot ? "Yes" : "No"}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "pg" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">PG Details</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">Gender Preference</dt><dd className="font-medium capitalize">{genderPreference}</dd></div>
                      <div><dt className="text-muted-foreground">Occupancy</dt><dd className="font-medium capitalize">{occupancyType}</dd></div>
                      <div><dt className="text-muted-foreground">Meals</dt><dd className="font-medium">{mealsIncluded ? "Yes" : "No"}</dd></div>
                      <div><dt className="text-muted-foreground">WiFi</dt><dd className="font-medium">{wifi ? "Yes" : "No"}</dd></div>
                      <div><dt className="text-muted-foreground">AC</dt><dd className="font-medium">{ac ? "Yes" : "No"}</dd></div>
                      <div><dt className="text-muted-foreground">Attached Bathroom</dt><dd className="font-medium">{attachedBathroom ? "Yes" : "No"}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "commercial" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Commercial Details</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium capitalize">{COMMERCIAL_TYPES.find(o => o.value === commercialType)?.label || commercialType}</dd></div>
                      <div><dt className="text-muted-foreground">Area</dt><dd className="font-medium">{areaSqft} sq.ft</dd></div>
                      {furnishing && <div><dt className="text-muted-foreground">Furnishing</dt><dd className="font-medium capitalize">{FURNISHING_OPTIONS.find(o => o.value === furnishing)?.label || furnishing}</dd></div>}
                      <div><dt className="text-muted-foreground">Parking</dt><dd className="font-medium">{parking ? "Yes" : "No"}</dd></div>
                      <div><dt className="text-muted-foreground">Power Backup</dt><dd className="font-medium">{powerBackup ? "Yes" : "No"}</dd></div>
                      <div><dt className="text-muted-foreground">Lift</dt><dd className="font-medium">{lift ? "Yes" : "No"}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "vehicle" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Vehicle Details</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium capitalize">{VEHICLE_TYPES.find(o => o.value === vehicleType)?.label || vehicleType}</dd></div>
                      <div><dt className="text-muted-foreground">Brand</dt><dd className="font-medium">{vehicleBrand}</dd></div>
                      <div><dt className="text-muted-foreground">Model</dt><dd className="font-medium">{vehicleModel}</dd></div>
                      <div><dt className="text-muted-foreground">Year</dt><dd className="font-medium">{vehicleYear}</dd></div>
                      {fuelType && <div><dt className="text-muted-foreground">Fuel Type</dt><dd className="font-medium capitalize">{FUEL_TYPES.find(o => o.value === fuelType)?.label || fuelType}</dd></div>}
                      {transmission && <div><dt className="text-muted-foreground">Transmission</dt><dd className="font-medium capitalize">{TRANSMISSION_TYPES.find(o => o.value === transmission)?.label || transmission}</dd></div>}
                      {kmDriven && <div><dt className="text-muted-foreground">KM Driven</dt><dd className="font-medium">{Number(kmDriven).toLocaleString("en-IN")} km</dd></div>}
                      {ownerNumber && <div><dt className="text-muted-foreground">Owner Number</dt><dd className="font-medium">{ownerNumber}</dd></div>}
                      {registrationState && <div><dt className="text-muted-foreground">Registration</dt><dd className="font-medium">{registrationState}</dd></div>}
                      <div><dt className="text-muted-foreground">Insurance</dt><dd className="font-medium">{insuranceValid ? "Valid" : "Expired / NA"}</dd></div>
                    </dl>
                  </div>
                )}

                {category === "commodity" && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Commodity Details</h3>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium capitalize">{COMMODITY_TYPES.find(o => o.value === commodityType)?.label || commodityType}</dd></div>
                      {commodityBrand && <div><dt className="text-muted-foreground">Brand</dt><dd className="font-medium">{commodityBrand}</dd></div>}
                      <div><dt className="text-muted-foreground">Condition</dt><dd className="font-medium capitalize">{CONDITION_OPTIONS.find(o => o.value === commodityCondition)?.label || commodityCondition}</dd></div>
                      <div><dt className="text-muted-foreground">Warranty</dt><dd className="font-medium">{warranty ? "Yes" : "No"}</dd></div>
                      {ageMonths && <div><dt className="text-muted-foreground">Age</dt><dd className="font-medium">{ageMonths} months</dd></div>}
                    </dl>
                  </div>
                )}

                {/* Location */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Location</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="sm:col-span-2"><dt className="text-muted-foreground">Address</dt><dd className="font-medium">{address}</dd></div>
                    <div><dt className="text-muted-foreground">Pincode</dt><dd className="font-medium">{pincode}</dd></div>
                  </dl>
                </div>

                {/* Images */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Images ({images.length})</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {previews.map((src, i) => (
                      <img key={i} src={src} alt={`Image ${i + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                    ))}
                  </div>
                </div>

                {/* Personal Details */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Contact Details</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{ownerName}</dd></div>
                    <div><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{ownerPhone}</dd></div>
                    <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{ownerEmail}</dd></div>
                  </dl>
                </div>

                {/* Payment */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Payment</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><dt className="text-muted-foreground">Amount Paid</dt><dd className="font-medium text-green-600">&#8377;{SERVICE_FEE}</dd></div>
                    <div><dt className="text-muted-foreground">Transaction ID</dt><dd className="font-medium">{paymentId}</dd></div>
                    <div><dt className="text-muted-foreground">Payment Status</dt><dd className="font-medium text-green-600">Paid</dd></div>
                  </dl>
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
            <Button onClick={handleNext} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
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
    </main>
  );
}
