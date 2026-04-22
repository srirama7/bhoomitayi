"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import {
  addTimerDuration,
  DEFAULT_TIMER_DURATION,
  sanitizeTimerDuration,
  type TimerDuration,
  hasTimerDuration,
} from "@/lib/listing-timer";
import { Clock } from "lucide-react";

interface ListingData {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  pincode: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  category: string;
  transaction_type: string;
  status: string;
  timer_duration?: Partial<TimerDuration> | null;
  expires_at?: string | null;
}

export default function EditListingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <EditListingForm />
    </Suspense>
  );
}

function EditListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("id");
  const { user, profile, loading: authLoading } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ListingData | null>(null);
  const [timer, setTimer] = useState<TimerDuration>(DEFAULT_TIMER_DURATION);
  const [resetTimer, setResetTimer] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !listingId) {
      setLoading(false);
      return;
    }

    async function fetchListing() {
      try {
        const docSnap = await getDoc(doc(db, "listings", listingId!));
        if (!docSnap.exists()) {
          toast.error("Listing not found");
          router.push(profile?.role === "admin" ? "/dashboard/admin/listings" : "/dashboard/my-listings");
          return;
        }
        const data = { id: docSnap.id, ...docSnap.data() } as ListingData;
        
        // Allow if owner OR admin
        if (data.user_id !== user!.uid && profile?.role !== "admin") {
          toast.error("You don't have permission to edit this listing");
          router.push("/dashboard/my-listings");
          return;
        }
        setForm(data);
        if (data.timer_duration) {
          setTimer(sanitizeTimerDuration(data.timer_duration));
        }
      } catch {
        toast.error("Failed to load listing");
      }
      setLoading(false);
    }

    fetchListing();
  }, [user, profile, authLoading, listingId, router]);

  async function handleSave() {
    if (!form || !listingId) return;

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.price || form.price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        owner_name: form.owner_name?.trim() || "",
        owner_phone: form.owner_phone?.trim() || "",
        owner_email: form.owner_email?.trim() || "",
        updated_at: new Date().toISOString(),
      };

      // Only admins can update the timer
      if (profile?.role === "admin") {
        updateData.timer_duration = timer;
        
        // Only update expires_at if:
        // 1. Admin explicitly checked "Reset/Start Timer"
        // 2. Listing is currently timed_out or pending_payment and has a timer duration
        const isInactive = form.status === "timed_out" || form.status === "pending_payment";
        
        if ((resetTimer || isInactive) && hasTimerDuration(timer)) {
          updateData.expires_at = addTimerDuration(new Date(), timer).toISOString();
          if (isInactive) {
            updateData.status = "active";
          }
        }
      }

      await updateDoc(doc(db, "listings", listingId), updateData);
      toast.success("Listing updated successfully!");
      router.push(profile?.role === "admin" ? "/dashboard/admin/listings" : "/dashboard/my-listings");
    } catch {
      toast.error("Failed to update listing");
    } finally {
      setSaving(false);
    }
  }

  const updateTimerField = (field: keyof TimerDuration, value: string) => {
    const num = Math.max(0, Number(value || 0));
    setTimer(prev => ({ ...prev, [field]: num }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Listing not found</p>
        <Link href="/dashboard/my-listings" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to My Listings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={profile?.role === "admin" ? "/dashboard/admin/listings" : "/dashboard/my-listings"}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Listing</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-base">
              Listing Details
              <span className="ml-2 text-xs font-normal text-muted-foreground capitalize">({form.category} · {form.transaction_type})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price (INR)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Admin Timer Controls */}
          {profile?.role === "admin" && (
            <Card className="rounded-2xl border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10 shadow-3d overflow-hidden">
              <div className="bg-blue-600 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Admin: Listing Timer</h3>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <p className="text-xs text-muted-foreground">Adjust the visibility timer for this listing. Saving will update the expiry time.</p>
                <div className="grid grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold block text-center">MONTH</Label>
                    <Input type="number" min="0" value={timer.months} onChange={(e) => updateTimerField("months", e.target.value)} className="h-9 text-center" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold block text-center">DAY</Label>
                    <Input type="number" min="0" value={timer.days} onChange={(e) => updateTimerField("days", e.target.value)} className="h-9 text-center" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold block text-center">HR</Label>
                    <Input type="number" min="0" value={timer.hours} onChange={(e) => updateTimerField("hours", e.target.value)} className="h-9 text-center" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold block text-center">MIN</Label>
                    <Input type="number" min="0" value={timer.minutes} onChange={(e) => updateTimerField("minutes", e.target.value)} className="h-9 text-center" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold block text-center">SEC</Label>
                    <Input type="number" min="0" value={timer.seconds} onChange={(e) => updateTimerField("seconds", e.target.value)} className="h-9 text-center" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Checkbox 
                    id="reset-timer" 
                    checked={resetTimer} 
                    onCheckedChange={(v) => setResetTimer(v as boolean)} 
                  />
                  <Label htmlFor="reset-timer" className="text-xs font-bold cursor-pointer text-blue-700">
                    Reset/Restart Timer from Now
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.owner_phone}
                  onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.owner_email}
                  onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button onClick={handleSave} disabled={saving} size="lg" className="w-full h-12 shadow-lg">
              {saving ? (
                <><Loader2 className="size-5 animate-spin mr-2" />Saving Changes...</>
              ) : (
                <><Save className="size-5 mr-2" />Update Listing</>
              )}
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={profile?.role === "admin" ? "/dashboard/admin/listings" : "/dashboard/my-listings"}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
