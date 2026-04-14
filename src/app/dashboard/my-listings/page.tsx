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
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [reactivatingListing, setReactivatingListing] = useState<Listing | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => forceTick((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleReactivatePayment = async () => {
    if (!reactivatingListing) return;

    setReactivating(true);
    try {
      const nextReactivationCount = (reactivatingListing.reactivation_count ?? 0) + 1;
      const submittedAt = new Date().toISOString();

      await updateDoc(doc(db, "listings", reactivatingListing.id), {
        status: "pending_payment",
        payment_status: "pending",
        payment_amount: LISTING_FEE,
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
                payment_amount: LISTING_FEE,
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
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("listing.my_listings")}</h1>

      {derivedListings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              {t("listing.no_listings")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("listing.no_listings_desc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {derivedListings.map((listing) => {
            const status = statusConfig[listing.status];
            const remainingMs = getRemainingTimeMs(listing.expires_at);

            return (
              <Card
                key={listing.id}
                className="rounded-2xl border-zinc-200/80 bg-white shadow-3d transition-all duration-300 hover:-translate-y-0.5 dark:border-zinc-800/80 dark:bg-zinc-900/80"
              >
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
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

                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{listing.title}</h3>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm capitalize text-muted-foreground">
                      {listing.category} &middot; {listing.transaction_type}
                    </p>
                    <p className="text-lg font-bold">{formatPrice(listing.price)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("listing.created")}{" "}
                      {new Date(listing.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <ListingCountdown
                      expiresAt={listing.expires_at}
                      status={listing.status}
                      onReactivate={() => setReactivatingListing(listing)}
                      reactivating={reactivating}
                      showRestartButton={listing.status === "timed_out"}
                    />
                    {listing.status === "pending_payment" &&
                      listing.payment_reason === "reactivation" && (
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                          Restart payment of ₹{LISTING_FEE} submitted. Waiting for admin approval to restart the timer.
                        </p>
                      )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/my-listings/edit?id=${listing.id}`}>
                        <Pencil className="size-4" />
                        {t("listing.edit")}
                      </Link>
                    </Button>

                    {listing.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsSold(listing.id)}
                      >
                        <Tag className="size-4" />
                        {t("listing.mark_as_sold")}
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                          disabled={generatingPdf === listing.id}
                        >
                          {generatingPdf === listing.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <FileDown className="size-4" />
                          )}
                          {generatingPdf === listing.id
                            ? t("listing.generating_pdf")
                            : t("listing.download_pdf")}
                          <ChevronDown className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl">
                        <DropdownMenuItem
                          onClick={() => handleDownloadPdf(listing, i18n.language)}
                          className="mx-1 rounded-lg"
                        >
                          <FileDown className="mr-2 size-4" />
                          {t("listing.download_current_lang")}
                        </DropdownMenuItem>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <DropdownMenuItem
                            key={lang.code}
                            onClick={() => handleDownloadPdf(listing, lang.code)}
                            className="mx-1 rounded-lg"
                          >
                            {lang.nativeLabel}
                            {lang.code !== "en" && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {lang.label}
                              </span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(listing.id)}
                    >
                      <Trash2 className="size-4" />
                      {t("listing.delete")}
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
