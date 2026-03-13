"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/lib/store";
import { db, storage } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { validateImage, validateImageCount } from "@/lib/image-upload";
import {
  COMMERCIAL_TYPES,
  FURNISHING_OPTIONS,
  TRANSACTION_TYPES,
} from "@/lib/constants";
import { PaymentGateway } from "@/components/listings/upi-payment-dialog";

const STEPS = [
  "Basic Details",
  "Service Details",
  "Location",
  "Images",
  "Preview & Submit",
];

interface FormData {
  transaction_type: "buy" | "sell" | "rent" | "";
  title: string;
  description: string;
  price: number | "";
  commercial_type: string;
  area_sqft: number | "";
  furnishing: string;
  floors: number | "";
  parking: boolean;
  power_backup: boolean;
  lift: boolean;
  address: string;
  pincode: string;
}

export default function SellCommercialPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirectTo=/sell/commercial");
    }
  }, [user, loading, router]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingListingData, setPendingListingData] = useState<Record<string, unknown> | null>(null);

  const [form, setForm] = useState<FormData>({
    transaction_type: "",
    title: "",
    description: "",
    price: "",
    commercial_type: "",
    area_sqft: "",
    furnishing: "",
    floors: "",
    parking: false,
    power_backup: false,
    lift: false,
    address: "",
    pincode: "",
  });

  function updateForm<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function validateStep(): boolean {
    switch (step) {
      case 0: {
        if (!form.transaction_type) {
          toast.error("Please select a transaction type");
          return false;
        }
        if (!form.title.trim()) {
          toast.error("Please enter a title");
          return false;
        }
        if (form.title.length > 120) {
          toast.error("Title must be 120 characters or less");
          return false;
        }
        if (!form.description.trim()) {
          toast.error("Please enter a description");
          return false;
        }
        if (form.description.length > 2000) {
          toast.error("Description must be 2000 characters or less");
          return false;
        }
        if (!form.price || Number(form.price) <= 0) {
          toast.error("Please enter a valid price");
          return false;
        }
        return true;
      }
      case 1: {
        if (!form.commercial_type) {
          toast.error("Please select a commercial type");
          return false;
        }
        if (!form.area_sqft || Number(form.area_sqft) <= 0) {
          toast.error("Please enter a valid area");
          return false;
        }
        if (!form.furnishing) {
          toast.error("Please select a furnishing option");
          return false;
        }
        return true;
      }
      case 2: {
        if (!form.address.trim()) {
          toast.error("Please enter an address");
          return false;
        }
        if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) {
          toast.error("Please enter a valid 6-digit pincode");
          return false;
        }
        return true;
      }
      case 3: {
        if (images.length < 1) {
          toast.error("Please upload at least 1 image");
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  }

  function handleNext() {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
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

      const details = {
        commercial_type: form.commercial_type,
        area_sqft: Number(form.area_sqft),
        furnishing: form.furnishing,
        floors: form.floors ? Number(form.floors) : undefined,
        parking: form.parking,
        power_backup: form.power_backup,
        lift: form.lift,
      };

      setPendingListingData({
        user_id: user.uid,
        category: "commercial",
        transaction_type: form.transaction_type as "buy" | "sell" | "rent",
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        images: imageUrls,
        details,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setShowPaymentDialog(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create listing"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentConfirmed() {
    if (!pendingListingData) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "listings"), {
        ...pendingListingData,
        payment_status: "pending",
        status: "pending_payment",
      });

      setShowPaymentDialog(false);
      setPendingListingData(null);
      toast.success("Listing submitted! It will go live after admin verifies your payment.");
      router.push("/dashboard/my-listings");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create listing"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  const priceLabel =
    form.transaction_type === "rent" ? "Rent per Month (INR)" : "Price (INR)";

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          Register a Commercial Service
        </h1>

        {/* Progress Indicator */}
        <div className="mb-10">
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
                  {i + 1}
                </div>
                <span className="hidden sm:block text-xs mt-1.5 text-muted-foreground text-center">
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

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Details */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select
                    value={form.transaction_type}
                    onValueChange={(val) =>
                      updateForm(
                        "transaction_type",
                        val as FormData["transaction_type"]
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_TYPES.commercial.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                    maxLength={120}
                    placeholder="e.g. 1500 sq.ft Office Space in Bandra Kurla Complex"
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.title.length}/120 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Describe the commercial space, facilities, access..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.description.length}/2000 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">{priceLabel}</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      updateForm(
                        "price",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    min={0}
                    placeholder="Enter amount"
                  />
                </div>
              </>
            )}

            {/* Step 2: Service Details */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Commercial Type</Label>
                  <Select
                    value={form.commercial_type}
                    onValueChange={(val) =>
                      updateForm("commercial_type", val)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select commercial type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMERCIAL_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_sqft">Area (sq.ft)</Label>
                  <Input
                    id="area_sqft"
                    type="number"
                    value={form.area_sqft}
                    onChange={(e) =>
                      updateForm(
                        "area_sqft",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    min={1}
                    placeholder="Enter area in sq.ft"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Furnishing</Label>
                  <Select
                    value={form.furnishing}
                    onValueChange={(val) => updateForm("furnishing", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select furnishing" />
                    </SelectTrigger>
                    <SelectContent>
                      {FURNISHING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floors">Floors</Label>
                  <Input
                    id="floors"
                    type="number"
                    value={form.floors}
                    onChange={(e) =>
                      updateForm(
                        "floors",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    min={1}
                    placeholder="Number of floors"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="parking"
                      checked={form.parking}
                      onCheckedChange={(val) => updateForm("parking", val)}
                    />
                    <Label htmlFor="parking">Parking Available</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="power_backup"
                      checked={form.power_backup}
                      onCheckedChange={(val) =>
                        updateForm("power_backup", val)
                      }
                    />
                    <Label htmlFor="power_backup">Power Backup</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="lift"
                      checked={form.lift}
                      onCheckedChange={(val) => updateForm("lift", val)}
                    />
                    <Label htmlFor="lift">Lift</Label>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Location */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    placeholder="Enter full address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={form.pincode}
                    onChange={(e) => updateForm("pincode", e.target.value)}
                    maxLength={6}
                    placeholder="6-digit pincode"
                  />
                </div>
              </>
            )}

            {/* Step 4: Images */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Upload Images (1-4)</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleImageSelect}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, or WebP. Max 5 MB each. {images.length}/4 images
                    uploaded.
                  </p>
                </div>

                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={src}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full size-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 5: Preview & Submit */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    Basic Details
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Transaction Type</dt>
                      <dd className="font-medium capitalize">
                        {form.transaction_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{priceLabel}</dt>
                      <dd className="font-medium">
                        {Number(form.price).toLocaleString("en-IN")}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Title</dt>
                      <dd className="font-medium">{form.title}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Description</dt>
                      <dd className="font-medium whitespace-pre-wrap">
                        {form.description}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    Service Details
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Commercial Type</dt>
                      <dd className="font-medium capitalize">
                        {COMMERCIAL_TYPES.find(
                          (o) => o.value === form.commercial_type
                        )?.label || form.commercial_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Area</dt>
                      <dd className="font-medium">{form.area_sqft} sq.ft</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Furnishing</dt>
                      <dd className="font-medium capitalize">
                        {FURNISHING_OPTIONS.find(
                          (o) => o.value === form.furnishing
                        )?.label || form.furnishing}
                      </dd>
                    </div>
                    {form.floors && (
                      <div>
                        <dt className="text-muted-foreground">Floors</dt>
                        <dd className="font-medium">{form.floors}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Parking</dt>
                      <dd className="font-medium">
                        {form.parking ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Power Backup</dt>
                      <dd className="font-medium">
                        {form.power_backup ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Lift</dt>
                      <dd className="font-medium">
                        {form.lift ? "Yes" : "No"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    Location
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Address</dt>
                      <dd className="font-medium">{form.address}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Pincode</dt>
                      <dd className="font-medium">{form.pincode}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    Images ({images.length})
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {previews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Image ${i + 1}`}
                        className="w-full h-20 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 0}
          >
            Previous
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Listing"}
            </Button>
          )}
        </div>
      </div>

      <PaymentGateway
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onPaymentConfirmed={handlePaymentConfirmed}
        submitting={submitting}
      />
    </main>
  );
}
