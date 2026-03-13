"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

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
  const { user, loading: authLoading } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ListingData | null>(null);

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
          router.push("/dashboard/my-listings");
          return;
        }
        const data = { id: docSnap.id, ...docSnap.data() } as ListingData;
        if (data.user_id !== user!.uid) {
          toast.error("You can only edit your own listings");
          router.push("/dashboard/my-listings");
          return;
        }
        setForm(data);
      } catch {
        toast.error("Failed to load listing");
      }
      setLoading(false);
    }

    fetchListing();
  }, [user, authLoading, listingId, router]);

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
      await updateDoc(doc(db, "listings", listingId), {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        owner_name: form.owner_name.trim(),
        owner_phone: form.owner_phone.trim(),
        owner_email: form.owner_email.trim(),
        updated_at: new Date().toISOString(),
      });
      toast.success("Listing updated successfully!");
      router.push("/dashboard/my-listings");
    } catch {
      toast.error("Failed to update listing");
    } finally {
      setSaving(false);
    }
  }

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
          <Link href="/dashboard/my-listings">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Listing</h1>
      </div>

      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-base">
            Editing: {form.title}
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
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Owner Phone</Label>
              <Input
                value={form.owner_phone}
                onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Owner Email</Label>
              <Input
                value={form.owner_email}
                onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href="/dashboard/my-listings">Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="size-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="size-4" />Save Changes</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
