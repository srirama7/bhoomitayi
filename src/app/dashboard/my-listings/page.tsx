"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2,
  Pencil,
  Tag,
  FileDown,
  ChevronDown,
  Loader2,
  Search,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { generateListingPDF } from "@/lib/generate-pdf";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import {
  getEffectiveListingStatus,
  getRemainingTimeMs,
  LISTING_FEE,
} from "@/lib/listing-timer";
import { ListingCountdown } from "@/components/listings/listing-countdown";
import type { Listing } from "@/lib/types/database";
import { PaymentGateway } from "@/components/listings/upi-payment-dialog";

type DisplayStatus = Listing["status"];

export default function MyListingsPage() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [reactivatingListing, setReactivatingListing] = useState<Listing | null>(null);
  const [reactivating, setReactivating] = useState(false);



  const statusConfig: Record<
    DisplayStatus,
    { label: string; className: string }
  > = {
    active: {
      label: t("listing.status.active"),
      className:
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    },
    pending: {
      label: t("listing.status.pending"),
      className:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    },
    pending_payment: {
      label: t("listing.status.pending_payment"),
      className:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    },
    rejected: {
      label: t("listing.status.rejected"),
      className:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
    },
    sold: {
      label: t("listing.status.sold"),
      className:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    },
    archived: {
      label: t("listing.status.archived"),
      className:
        "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700",
    },
    timed_out: {
      label: "Timed Out",
      className:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
    },
  };

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

  const derivedListings = useMemo(
    () =>
      listings.map((listing) => ({
        ...listing,
        status: getEffectiveListingStatus(listing),
      })),
    [listings]
  );

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return derivedListings;
    const q = searchQuery.toLowerCase();
    return derivedListings.filter((l) =>
      l.title.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      statusConfig[l.status]?.label.toLowerCase().includes(q)
    );
  }, [derivedListings, searchQuery]);

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
      await updateDoc(doc(db, "listings", id), {
        status: "sold",
        updated_at: new Date().toISOString(),
      });
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l))
      );
      toast.success("Listing marked as sold");
    } catch {
      toast.error("Failed to update listing");
    }
  };

  const handleReactivatePayment = async (plan?: any) => {
    if (!reactivatingListing) return;

    setReactivating(true);
    try {
      const nextReactivationCount = (reactivatingListing.reactivation_count ?? 0) + 1;
      const submittedAt = new Date().toISOString();

      await updateDoc(doc(db, "listings", reactivatingListing.id), {
        status: "pending_payment",
        payment_status: "pending",
        payment_amount: plan?.price || LISTING_FEE,
        booster_plan: plan?.name || "Basic",
        plan_days: plan?.days || 30,
        payment_reason: "reactivation",
        last_payment_submitted_at: submittedAt,
        reactivation_count: nextReactivationCount,
        expires_at: null,
        updated_at: submittedAt,
      });

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === reactivatingListing.id
            ? {
                ...listing,
                status: "pending_payment",
                payment_status: "pending",
                payment_amount: plan?.price || LISTING_FEE,
                booster_plan: plan?.name || "Basic",
                plan_days: plan?.days || 30,
                payment_reason: "reactivation",
                last_payment_submitted_at: submittedAt,
                reactivation_count: nextReactivationCount,
                expires_at: null,
                updated_at: submittedAt,
              }
            : listing
        )
      );

      setReactivatingListing(null);
      toast.success("Restart payment submitted. Admin will review it and restart the timer.");
    } catch (error) {
      console.error("Failed to submit reactivation payment:", error);
      toast.error("Failed to submit reactivation payment");
    }

    setReactivating(false);
  };

  const handleDownloadPdf = async (listing: Listing, lang: string) => {
    setGeneratingPdf(listing.id);
    try {
      await generateListingPDF(listing, lang);
      toast.success(t("listing.download_pdf"));
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF");
    }
    setGeneratingPdf(null);
  };

  if (loading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="relative min-h-[80vh] w-full">
      {/* Decorative ambient background */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-purple-500/10 dark:bg-purple-400/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <h1 className="text-2xl font-bold">{t("listing.my_listings")}</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search listings by title or status..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-900 rounded-xl"
          />
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <Card className="border-0 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl shadow-2xl overflow-hidden rounded-[2.5rem] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <CardContent className="flex flex-col items-center justify-center py-20 relative z-10 text-center px-4">
            <div className="size-24 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-6 shadow-inner ring-1 ring-blue-100 dark:ring-blue-800">
              <Tag className="size-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {t("listing.no_listings")}
            </h3>
            <p className="text-lg text-muted-foreground max-w-md">
              {t("listing.no_listings_desc")}
            </p>
            <Button asChild className="mt-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl px-8 py-6 text-md font-bold">
              <Link href="/sell">Create Your First Listing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const status = statusConfig[listing.status];
            const remainingMs = getRemainingTimeMs(listing.expires_at);

            return (
              <Card
                key={listing.id}
                className="group flex flex-col rounded-[2rem] border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
              >
                <div className="relative h-48 w-full shrink-0 overflow-hidden">
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/50 text-xs text-muted-foreground font-medium">
                      No Image Available
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className={`${status.className} border-0 shadow-md backdrop-blur-md font-bold px-3 py-1`}>
                      {status.label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex-1 space-y-3">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400">
                      {listing.category} &middot; {listing.transaction_type}
                    </p>
                    <h3 className="font-bold text-xl line-clamp-1 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-2xl font-extrabold text-foreground tracking-tight">
                      {formatPrice(listing.price)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Calendar className="size-3.5" />
                      {t("listing.created")}{" "}
                      {(() => {
                        const date = new Date(listing.created_at);
                        return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${date.getFullYear()}`;
                      })()}
                    </p>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <ListingCountdown
                        expiresAt={listing.expires_at}
                        status={listing.status}
                        onReactivate={() => setReactivatingListing(listing)}
                        reactivating={reactivating}
                        showRestartButton={listing.status === "timed_out"}
                        timerDuration={listing.timer_duration}
                      />
                    </div>
                    {listing.status === "pending_payment" &&
                      listing.payment_reason === "reactivation" && (
                        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg">
                          Restart payment of ₹{LISTING_FEE} submitted. Waiting for admin approval.
                        </p>
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <Button variant="outline" className="w-full rounded-xl font-semibold hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30" asChild>
                      <Link href={`/dashboard/my-listings/edit?id=${listing.id}`}>
                        <Pencil className="size-4 mr-2" />
                        Edit
                      </Link>
                    </Button>

                    {listing.status === "active" ? (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl font-semibold hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
                        onClick={() => handleMarkAsSold(listing.id)}
                      >
                        <Tag className="size-4 mr-2" />
                        Sold
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl font-semibold border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        disabled={generatingPdf === listing.id}
                        onClick={() => handleDownloadPdf(listing, "en")}
                      >
                        {generatingPdf === listing.id ? (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        ) : (
                          <FileDown className="size-4 mr-2" />
                        )}
                        Invoice
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      className="col-span-2 rounded-xl font-semibold mt-1"
                      onClick={() => setDeleteId(listing.id)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete Listing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("listing.delete_listing")}</DialogTitle>
            <DialogDescription>{t("listing.delete_confirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("listing.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("listing.deleting") : t("listing.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentGateway
        open={!!reactivatingListing}
        onOpenChange={(open) => {
          if (!open && !reactivating) {
            setReactivatingListing(null);
          }
        }}
        onPaymentConfirmed={handleReactivatePayment}
        submitting={reactivating}
        flowLabel="Restart Fee"
        reviewMessage="Your restart payment has been submitted. Admin will verify it and restart the listing timer."
        submitLabel="Submit Restart Request"
      />
    </div>
  );
}
