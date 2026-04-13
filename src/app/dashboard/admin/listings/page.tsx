"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldAlert,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { formatPrice } from "@/lib/constants";
import {
  addTimerDuration,
  DEFAULT_TIMER_DURATION,
  formatRemainingDuration,
  getEffectiveListingStatus,
  getRemainingTimeMs,
  hasTimerDuration,
  sanitizeTimerDuration,
  type TimerDuration,
} from "@/lib/listing-timer";
import { useAuthStore } from "@/lib/store";
import type { Listing } from "@/lib/types/database";

type AdminListing = Listing & {
  sellerName: string;
  sellerPhone: string | null;
};

type TimerMap = Record<string, TimerDuration>;

export default function AdminListingsPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [timerInputs, setTimerInputs] = useState<TimerMap>({});

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
      const nextStatus =
        activateAfterSave || listing.status === "pending_payment" ? "active" : listing.status;

      await updateDoc(doc(db, "listings", listing.id), {
        status: nextStatus,
        payment_status: nextStatus === "active" ? "approved" : listing.payment_status ?? "approved",
        expires_at: expiresAt,
        timer_duration: duration,
        updated_at: new Date().toISOString(),
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
                updated_at: new Date().toISOString(),
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

  const handleRestoreSoldListing = async (listingId: string) => {
    setUpdatingId(listingId);

    try {
      await updateDoc(doc(db, "listings", listingId), {
        status: "active",
        updated_at: new Date().toISOString(),
      });

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, status: "active", updated_at: new Date().toISOString() }
            : listing
        )
      );
      toast.success("Listing restored to active");
    } catch (error) {
      console.error("Failed to restore listing:", error);
      toast.error("Failed to restore listing");
    }

    setUpdatingId(null);
  };

  if (authLoading || loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Admin Listings</h1>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    return (
      <Card className="rounded-2xl border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <ShieldAlert className="size-10 text-red-600 dark:text-red-400" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Admin Access Required</h1>
            <p className="text-sm text-muted-foreground">
              Only admin accounts can manage listing timers and payments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Listings</h1>
          <p className="text-sm text-muted-foreground">
            Set expiry timers, approve reactivation payments, and restore sold listings.
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
        >
          {visibleListings.length} listing{visibleListings.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {visibleListings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No listings found</p>
            <p className="text-sm text-muted-foreground">
              There are no listings available for admin action right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleListings.map((listing) => {
            const effectiveStatus = getEffectiveListingStatus(listing);
            const remainingMs = getRemainingTimeMs(listing.expires_at);
            const timer = timerInputs[listing.id] ?? DEFAULT_TIMER_DURATION;

            return (
              <Card
                key={listing.id}
                className="rounded-2xl border-zinc-200/80 bg-white shadow-3d transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-900/80"
              >
                <CardContent className="flex flex-col gap-5 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-md sm:w-32">
                      {listing.images?.[0] ? (
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-foreground">{listing.title}</h2>
                        <Badge
                          className={
                            effectiveStatus === "timed_out"
                              ? "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                              : effectiveStatus === "pending_payment"
                                ? "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
                                : effectiveStatus === "sold"
                                  ? "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                                  : "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }
                        >
                          {effectiveStatus.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm capitalize text-muted-foreground">
                        {listing.category} &middot; {listing.transaction_type}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {formatPrice(listing.price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Seller: {listing.sellerName}
                        {listing.sellerPhone ? ` | ${listing.sellerPhone}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(listing.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {remainingMs !== null && effectiveStatus === "active" && (
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-300">
                          Time left: {formatRemainingDuration(remainingMs)}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/listing/${listing.id}`}>Open Listing</Link>
                      </Button>
                      {listing.status === "sold" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreSoldListing(listing.id)}
                          disabled={updatingId === listing.id}
                        >
                          {updatingId === listing.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Mark Active
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200/80 p-4 dark:border-zinc-800/80">
                    <div className="mb-3 flex items-center gap-2">
                      <Clock3 className="size-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-foreground">
                        Listing Timer
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <TimerField
                        label="Months"
                        value={timer.months}
                        onChange={(value) =>
                          updateTimerField(listing.id, "months", value)
                        }
                      />
                      <TimerField
                        label="Days"
                        value={timer.days}
                        onChange={(value) =>
                          updateTimerField(listing.id, "days", value)
                        }
                      />
                      <TimerField
                        label="Minutes"
                        value={timer.minutes}
                        onChange={(value) =>
                          updateTimerField(listing.id, "minutes", value)
                        }
                      />
                      <TimerField
                        label="Seconds"
                        value={timer.seconds}
                        onChange={(value) =>
                          updateTimerField(listing.id, "seconds", value)
                        }
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {effectiveStatus === "active" && (
                        <Button
                          size="sm"
                          onClick={() => handleSetTimer(listing, false)}
                          disabled={updatingId === listing.id}
                        >
                          {updatingId === listing.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Clock3 className="size-4" />
                          )}
                          Save Timer
                        </Button>
                      )}

                      {listing.status === "pending_payment" && (
                        <Button
                          size="sm"
                          onClick={() => handleSetTimer(listing, true)}
                          disabled={updatingId === listing.id}
                        >
                          {updatingId === listing.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Approve Payment and Start Timer
                        </Button>
                      )}

                      {effectiveStatus === "timed_out" && (
                        <p className="text-xs text-muted-foreground">
                          Timed out listings stay hidden until the seller pays the reactivation fee again.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
