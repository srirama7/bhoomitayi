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
  GENDER_OPTIONS,
  OCCUPANCY_OPTIONS,
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
  title: string;
  description: string;
  price: number | "";
  security_deposit: number | "";
  gender_preference: string;
  occupancy_type: string;
  meals_included: boolean;
  meal_types: string;
  wifi: boolean;
  laundry: boolean;
  ac: boolean;
  attached_bathroom: boolean;
  rules: string;
  available_from: string;
  amenities: string;
  address: string;
  pincode: string;
}

export default function SellPGPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirectTo=/sell/pg");
    }
  }, [user, loading, router]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingListingData, setPendingListingData] = useState<Record<string, unknown> | null>(null);

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    security_deposit: "",
    gender_preference: "",
    occupancy_type: "",
    meals_included: false,
    meal_types: "",
    wifi: false,
    laundry: false,
    ac: false,
    attached_bathroom: false,
    rules: "",
    available_from: "",
    amenities: "",
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
          toast.error("Please enter a valid rent amount");
          return false;
        }
        return true;
      }
      case 1: {
        if (!form.security_deposit && form.security_deposit !== 0) {
          toast.error("Please enter a security deposit amount");
          return false;
        }
        if (!form.gender_preference) {
          toast.error("Please select a gender preference");
          return false;
        }
        if (!form.occupancy_type) {
          toast.error("Please select an occupancy type");
          return false;
        }
        if (!form.available_from) {
          toast.error("Please select an available from date");
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
        rent_per_month: Number(form.price),
        security_deposit: Number(form.security_deposit),
        gender_preference: form.gender_preference,
        occupancy_type: form.occupancy_type,
        meals_included: form.meals_included,
        meal_types: form.meal_types
          ? form.meal_types.split(",").map((m) => m.trim()).filter(Boolean)
          : undefined,
        wifi: form.wifi,
        laundry: form.laundry,
        ac: form.ac,
        attached_bathroom: form.attached_bathroom,
        rules: form.rules.trim() || undefined,
        available_from: form.available_from,
        amenities: form.amenities
          ? form.amenities.split(",").map((a) => a.trim()).filter(Boolean)
          : undefined,
      };

      setPendingListingData({
        user_id: user.uid,
        category: "pg",
        transaction_type: "rent",
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

  async function handlePaymentConfirmed(paymentRef: string, paymentId: string) {
    if (!pendingListingData) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "listings"), {
        ...pendingListingData,
        payment_ref: paymentRef,
        payment_id: paymentId,
        payment_amount: 1,
        payment_status: "paid",
        status: "active",
      });

      setShowPaymentDialog(false);
      setPendingListingData(null);
      toast.success("Payment successful! Your listing is now live.");
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

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          List a PG
        </h1>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center size-9 rounded-full text-sm font-semibold transition-colors ${
                    i < step
                      ? "bg-purple-600 text-white"
                      : i === step
                        ? "bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-900"
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
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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
                  <Input value="Rent" disabled />
                  <p className="text-xs text-muted-foreground">
                    PG listings are always set to Rent.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Girls PG near Koramangala with Meals"
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
                    placeholder="Describe the PG, facilities, rules..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.description.length}/2000 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Rent per Month (INR)</Label>
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
                    placeholder="Enter monthly rent"
                  />
                </div>
              </>
            )}

            {/* Step 2: Service Details */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="security_deposit">Security Deposit (INR)</Label>
                  <Input
                    id="security_deposit"
                    type="number"
                    value={form.security_deposit}
                    onChange={(e) =>
                      updateForm(
                        "security_deposit",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    min={0}
                    placeholder="Enter security deposit amount"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender Preference</Label>
                    <Select
                      value={form.gender_preference}
                      onValueChange={(val) =>
                        updateForm("gender_preference", val)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Occupancy Type</Label>
                    <Select
                      value={form.occupancy_type}
                      onValueChange={(val) =>
                        updateForm("occupancy_type", val)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select occupancy" />
                      </SelectTrigger>
                      <SelectContent>
                        {OCCUPANCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="meals_included"
                      checked={form.meals_included}
                      onCheckedChange={(val) =>
                        updateForm("meals_included", val)
                      }
                    />
                    <Label htmlFor="meals_included">Meals Included</Label>
                  </div>

                  {form.meals_included && (
                    <div className="space-y-2 pl-1">
                      <Label htmlFor="meal_types">Meal Types</Label>
                      <Input
                        id="meal_types"
                        value={form.meal_types}
                        onChange={(e) =>
                          updateForm("meal_types", e.target.value)
                        }
                        placeholder="e.g. Breakfast, Lunch, Dinner (comma-separated)"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Switch
                      id="wifi"
                      checked={form.wifi}
                      onCheckedChange={(val) => updateForm("wifi", val)}
                    />
                    <Label htmlFor="wifi">WiFi</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="laundry"
                      checked={form.laundry}
                      onCheckedChange={(val) => updateForm("laundry", val)}
                    />
                    <Label htmlFor="laundry">Laundry</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="ac"
                      checked={form.ac}
                      onCheckedChange={(val) => updateForm("ac", val)}
                    />
                    <Label htmlFor="ac">AC</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="attached_bathroom"
                      checked={form.attached_bathroom}
                      onCheckedChange={(val) =>
                        updateForm("attached_bathroom", val)
                      }
                    />
                    <Label htmlFor="attached_bathroom">Attached Bathroom</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rules">Rules</Label>
                  <Textarea
                    id="rules"
                    value={form.rules}
                    onChange={(e) => updateForm("rules", e.target.value)}
                    rows={3}
                    placeholder="e.g. No smoking, guests allowed until 10 PM..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="available_from">Available From</Label>
                  <Input
                    id="available_from"
                    type="date"
                    value={form.available_from}
                    onChange={(e) =>
                      updateForm("available_from", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amenities">Amenities</Label>
                  <Input
                    id="amenities"
                    value={form.amenities}
                    onChange={(e) => updateForm("amenities", e.target.value)}
                    placeholder="e.g. Gym, Parking, Study Room (comma-separated)"
                  />
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
                      <dd className="font-medium">Rent</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Rent per Month (INR)
                      </dt>
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
                      <dt className="text-muted-foreground">Security Deposit</dt>
                      <dd className="font-medium">
                        {Number(form.security_deposit).toLocaleString("en-IN")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Gender Preference</dt>
                      <dd className="font-medium capitalize">
                        {GENDER_OPTIONS.find(
                          (o) => o.value === form.gender_preference
                        )?.label || form.gender_preference}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Occupancy Type</dt>
                      <dd className="font-medium capitalize">
                        {OCCUPANCY_OPTIONS.find(
                          (o) => o.value === form.occupancy_type
                        )?.label || form.occupancy_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Meals Included</dt>
                      <dd className="font-medium">
                        {form.meals_included ? "Yes" : "No"}
                      </dd>
                    </div>
                    {form.meals_included && form.meal_types && (
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">Meal Types</dt>
                        <dd className="font-medium">{form.meal_types}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">WiFi</dt>
                      <dd className="font-medium">
                        {form.wifi ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Laundry</dt>
                      <dd className="font-medium">
                        {form.laundry ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">AC</dt>
                      <dd className="font-medium">
                        {form.ac ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Attached Bathroom
                      </dt>
                      <dd className="font-medium">
                        {form.attached_bathroom ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Available From</dt>
                      <dd className="font-medium">{form.available_from}</dd>
                    </div>
                    {form.rules && (
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">Rules</dt>
                        <dd className="font-medium whitespace-pre-wrap">
                          {form.rules}
                        </dd>
                      </div>
                    )}
                    {form.amenities && (
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">Amenities</dt>
                        <dd className="font-medium">{form.amenities}</dd>
                      </div>
                    )}
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
        userId={user.uid}
        customerName={profile?.full_name}
        customerEmail={user.email || undefined}
        customerPhone={profile?.phone || undefined}
      />
    </main>
  );
}
