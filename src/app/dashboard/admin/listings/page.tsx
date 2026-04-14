"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  IndianRupee,
  Loader2,
  ShieldAlert,
  Tag,
  Trash2,
  Pencil,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { formatPrice } from "@/lib/constants";
import {
  addTimerDuration,
  DEFAULT_TIMER_DURATION,
  LISTING_FEE,
  formatTimerDuration,
  getEffectiveListingStatus,
  getRemainingTimeMs,
  hasTimerDuration,
  sanitizeTimerDuration,
  type TimerDuration,
} from "@/lib/listing-timer";
import { useAuthStore } from "@/lib/store";
import type { Listing } from "@/lib/types/database";
import { ListingCountdown } from "@/components/listings/listing-countdown";

type AdminListing = Listing & {
  sellerName: string;
  sellerPhone: string | null;
  sellerEmail: string | null;
};

type TimerMap = Record<string, TimerDuration>;

export default function AdminListingsPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [timerInputs, setTimerInputs] = useState<TimerMap>({});
  const [, forceTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => forceTick((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    const fetchListings = async () => {
      try {
        const listingsQuery = query(
          collection(db, "listings"),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(listingsQuery);
        const allListings = snap.docs.map(
          (listingDoc) => ({ id: listingDoc.id, ...listingDoc.data() }) as Listing
        );

        const listingsWithProfiles = await Promise.all(
          allListings.map(async (listing) => {
            const profileSnap = await getDoc(doc(db, "profiles", listing.user_id));
            const sellerProfile = profileSnap.exists() ? profileSnap.data() : null;

            return {
              ...listing,
              sellerName: sellerProfile?.full_name ?? "Unknown seller",
              sellerPhone: sellerProfile?.phone ?? null,
              sellerEmail: sellerProfile?.email ?? null,
            };
          })
        );

        setListings(listingsWithProfiles);
        setTimerInputs(
          Object.fromEntries(
            listingsWithProfiles.map((listing) => [
              listing.id,
              sanitizeTimerDuration(listing.timer_duration ?? DEFAULT_TIMER_DURATION),
            ])
          )
        );
      } catch (error) {
        console.error("Failed to fetch listings:", error);
        toast.error("Failed to load listings");
      }

      setLoading(false);
    };

    fetchListings();
  }, [user, profile, authLoading]);

  const visibleListings = useMemo(
    () => listings.filter((listing) => listing.status !== "archived"),
    [listings]
  );

  const updateTimerField = (
    listingId: string,
    field: keyof TimerDuration,
    value: string
  ) => {
    const numericValue = Math.max(0, Number(value || 0));
    setTimerInputs((prev) => ({
      ...prev,
      [listingId]: {
        ...(prev[listingId] ?? DEFAULT_TIMER_DURATION),
        [field]: numericValue,
      },
    }));
  };

  const handleSetTimer = async (listing: AdminListing, activateAfterSave = false) => {
    const duration = sanitizeTimerDuration(timerInputs[listing.id]);

    if (!hasTimerDuration(duration)) {
      toast.error("Please enter a timer before saving");
      return;
    }

    setUpdatingId(listing.id);

    try {
      const expiresAt = addTimerDuration(new Date(), duration).toISOString();
      const updatedAt = new Date().toISOString();
      const nextStatus =
        activateAfterSave || listing.status === "pending_payment" ? "active" : listing.status;

      await updateDoc(doc(db, "listings", listing.id), {
        status: nextStatus,
        payment_status: nextStatus === "active" ? "approved" : listing.payment_status ?? "approved",
        expires_at: expiresAt,
        timer_duration: duration,
        updated_at: updatedAt,
      });

      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id
            ? {
                ...item,
                status: nextStatus,
                payment_status:
                  nextStatus === "active"
                    ? "approved"
                    : item.payment_status ?? "approved",
                expires_at: expiresAt,
                timer_duration: duration,
                updated_at: updatedAt,
              }
            : item
        )
      );

      toast.success(
        activateAfterSave || listing.status === "pending_payment"
          ? "Listing activated and timer started"
          : "Timer updated"
      );
    } catch (error) {
      console.error("Failed to save timer:", error);
      toast.error("Failed to save timer");
    }

    setUpdatingId(null);
  };

  const handleUpdateStatus = async (listingId: string, newStatus: Listing["status"]) => {
    setUpdatingId(listingId);
    try {
      await updateDoc(doc(db, "listings", listingId), {
        status: newStatus,
        updated_at: new Date().toISOString(),
      });
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l))
      );
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
    setUpdatingId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "listings", deleteId));
      setListings((prev) => prev.filter((l) => l.id !== deleteId));
      toast.success("Listing deleted successfully");
    } catch {
      toast.error("Failed to delete listing");
    }
    setDeleting(false);
    setDeleteId(null);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Admin Listings</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    return (
      <Card className="rounded-2xl border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <ShieldAlert className="size-10 text-red-600 dark:text-red-400" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Listings Control Panel</h1>
          <p className="text-muted-foreground text-sm">Full administrative control over all property and service listings.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">{visibleListings.length} Total</Badge>
      </div>

      <div className="grid gap-4">
        {visibleListings.map((listing) => {
          const effectiveStatus = getEffectiveListingStatus(listing);
          const remainingMs = getRemainingTimeMs(listing.expires_at);
          const timer = timerInputs[listing.id] ?? DEFAULT_TIMER_DURATION;

          return (
            <Card
              key={listing.id}
              className="rounded-2xl border-zinc-200/80 bg-white shadow-3d dark:border-zinc-800/80 dark:bg-zinc-900/80"
            >
              <CardContent className="p-5 flex flex-col gap-6">
                {/* Status Bar */}
                {listing.status === "pending_payment" && (
                  <div className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
                    listing.payment_reason === "reactivation" 
                      ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20" 
                      : "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/20"
                  }`}>
                    <IndianRupee className={`size-5 ${listing.payment_reason === "reactivation" ? "text-amber-600" : "text-blue-600"}`} />
                    <div className="flex-1">
                      <p className="font-bold text-sm uppercase">
                        {listing.payment_reason === "reactivation" ? "RESTART request Pending" : "Initial Payment Pending"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seller paid ₹{listing.payment_amount ?? LISTING_FEE}. Approve to {listing.payment_reason === "reactivation" ? "restart timer" : "activate listing"}.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Image & Main Info */}
                  <div className="flex gap-4 flex-1">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border">
                      {listing.images?.[0] ? (
                        <Image src={listing.images[0]} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-[10px]">No Image</div>
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold truncate max-w-[200px]">{listing.title}</h2>
                        <Badge className="capitalize text-[10px] h-5">{effectiveStatus.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{listing.address}</p>
                      <p className="text-sm font-bold text-blue-600">{formatPrice(listing.price)}</p>
                      <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground mt-2">
                        <span>Seller: <span className="text-foreground font-medium">{listing.sellerName}</span></span>
                        {listing.sellerPhone && <span>Phone: <span className="text-foreground font-medium">{listing.sellerPhone}</span></span>}
                        <span>ID: {listing.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Countdown or Timer Stats */}
                  <div className="md:w-64 space-y-2">
                    {effectiveStatus === "active" && (
                      <div className="scale-90 origin-top-right">
                        <ListingCountdown expiresAt={listing.expires_at} status={effectiveStatus} />
                      </div>
                    )}
                    {effectiveStatus === "timed_out" && (
                      <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 dark:bg-red-950/20 dark:border-red-900 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="size-5 text-red-600" />
                          <span className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Timed Out</span>
                        </div>
                        <p className="text-[10px] text-red-600/80 leading-tight">
                          This listing has expired and is hidden from public view. Set a new timer to reactivate it.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/listing/${listing.id}`} target="_blank"><ExternalLink className="size-3.5 mr-1" />View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/my-listings/edit?id=${listing.id}`}><Pencil className="size-3.5 mr-1" />Edit</Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteId(listing.id)}>
                      <Trash2 className="size-3.5 mr-1" />Delete
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {effectiveStatus === "sold" ? (
                      <Button size="sm" onClick={() => handleUpdateStatus(listing.id, "active")}>Restore to Active</Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(listing.id, "sold")}>Mark as Sold</Button>
                    )}
                  </div>
                </div>

                {/* Timer Configuration Section */}
                <div className={`rounded-xl border p-4 space-y-4 ${
                  effectiveStatus === "timed_out" 
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900" 
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                }`}>
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-blue-600" />
                    <span className="text-sm font-bold">
                      {effectiveStatus === "timed_out" ? "Reactivation Timer" : "Set Timer Duration"}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto font-medium">
                      Current: {formatTimerDuration(listing.timer_duration)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    <TimerInput label="MONTH" value={timer.months} onChange={(v) => updateTimerField(listing.id, "months", v)} />
                    <TimerInput label="DAY" value={timer.days} onChange={(v) => updateTimerField(listing.id, "days", v)} />
                    <TimerInput label="HR" value={timer.hours} onChange={(v) => updateTimerField(listing.id, "hours", v)} />
                    <TimerInput label="MIN" value={timer.minutes} onChange={(v) => updateTimerField(listing.id, "minutes", v)} />
                    <TimerInput label="SEC" value={timer.seconds} onChange={(v) => updateTimerField(listing.id, "seconds", v)} />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className={`flex-1 ${effectiveStatus === "timed_out" ? "bg-blue-600 hover:bg-blue-700" : ""}`} 
                      onClick={() => handleSetTimer(listing, effectiveStatus === "timed_out")}
                      disabled={updatingId === listing.id}
                    >
                      {updatingId === listing.id ? <Loader2 className="size-4 animate-spin mr-1" /> : <Clock3 className="size-4 mr-1" />}
                      {effectiveStatus === "active" ? "Update Timer" : effectiveStatus === "timed_out" ? "Reactivate & Start Timer" : "Save & Start Timer"}
                    </Button>
                    
                    {listing.status === "pending_payment" && (
                      <Button 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        onClick={() => handleSetTimer(listing, true)}
                        disabled={updatingId === listing.id}
                      >
                        <CheckCircle2 className="size-4 mr-1" />
                        Approve & Start
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing Permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This listing and all its associated data will be removed from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin mr-1" /> : <Trash2 className="size-4 mr-1" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimerInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-muted-foreground block text-center">{label}</span>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-center text-xs px-1"
      />
    </div>
  );
}
