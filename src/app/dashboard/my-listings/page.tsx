"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, Pencil, Tag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { formatPrice } from "@/lib/constants";
import type { Listing } from "@/lib/types/database";

const statusConfig: Record<
  Listing["status"],
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
  pending_payment: {
    label: "Payment Verification",
    className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  },
  sold: {
    label: "Sold",
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  },
  archived: {
    label: "Archived",
    className: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700",
  },
};

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchListings = async () => {
      try {
        const listingsQuery = query(
          collection(db, "listings"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(listingsQuery);
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Listing
        );
        setListings(data);
      } catch {
        toast.error("Failed to fetch listings");
      }
      setLoading(false);
    };

    fetchListings();
  }, [user, authLoading]);

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

  const handleMarkAsSold = async (id: string) => {
    try {
      await updateDoc(doc(db, "listings", id), { status: "sold" });
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "sold" as const } : l))
      );
      toast.success("Listing marked as sold");
    } catch {
      toast.error("Failed to update listing");
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Listings</h1>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              No listings yet
            </p>
            <p className="text-sm text-muted-foreground">
              Your listings will appear here once you create one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => {
            const status = statusConfig[listing.status];
            return (
              <Card key={listing.id} className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Thumbnail */}
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-md sm:w-32">
                    {listing.images && listing.images.length > 0 ? (
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

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{listing.title}</h3>
                      <Badge
                        variant="outline"
                        className={status.className}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm capitalize text-muted-foreground">
                      {listing.category} &middot; {listing.transaction_type}
                    </p>
                    <p className="text-lg font-bold">
                      {formatPrice(listing.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(listing.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    {listing.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsSold(listing.id)}
                      >
                        <Tag className="size-4" />
                        Mark as Sold
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(listing.id)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
