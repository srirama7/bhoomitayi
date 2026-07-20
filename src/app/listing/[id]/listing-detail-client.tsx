"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getListingById, getSimilarListings } from "@/lib/queries";
import { ImageGallery } from "@/components/listings/image-gallery";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { ListingCard } from "@/components/listings/listing-card";
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
import { formatPrice, formatArea } from "@/lib/constants";
import {
  getEffectiveListingStatus,
  getRemainingTimeMs,
} from "@/lib/listing-timer";
import { ListingCountdown } from "@/components/listings/listing-countdown";
import {
  MapPin, Bed, Bath, Maximize, Calendar, Car, Wifi,
  Wind, ShowerHead, Building2, Fence, Compass,
  Users, UtensilsCrossed, Home, ChevronRight, Flag,
  Gauge, Fuel, Settings2, Package, ShieldCheck, Trash2,
  Phone, Mail, Copy,
} from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/lib/types/database";
import { ReportButton } from "@/components/listings/report-button";
import { ShareButton } from "@/components/listings/share-button";
import { QrButton } from "@/components/listings/qr-button";
import { FlyerButton } from "@/components/listings/flyer-button";
import { ListingTools } from "@/components/listings/listing-tools";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { formatPhoneWithCountryCode } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export default function ListingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");
  const id = (queryId || params.id) as string;
  const { user } = useAuthStore();

  const [listing, setListing] = useState<Listing | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; phone: string | null; avatar_url: string | null; email?: string | null } | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);

  // Auto-translate states
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [translatedAddress, setTranslatedAddress] = useState("");
  const [translationLang, setTranslationLang] = useState("");
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async (targetLang: string) => {
    if (!listing) return;
    if (!targetLang) {
      setTranslationLang("");
      setTranslatedTitle("");
      setTranslatedDesc("");
      setTranslatedAddress("");
      return;
    }

    setTranslating(true);
    setTranslationLang(targetLang);

    try {
      const translateText = async (text: string) => {
        if (!text || !text.trim()) return "";
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Translation request failed");
        const data = await res.json();
        return data[0].map((x: any) => x[0]).join("");
      };

      const [tTitle, tDesc, tAddress] = await Promise.all([
        translateText(listing.title),
        translateText(listing.description || ""),
        translateText(listing.address),
      ]);

      setTranslatedTitle(tTitle);
      setTranslatedDesc(tDesc);
      setTranslatedAddress(tAddress);
    } catch (err) {
      console.error("Translation error:", err);
      toast.error("Auto-translation failed. Please try again.");
      setTranslationLang("");
    } finally {
      setTranslating(false);
    }
  };

  const isOwner = user && listing && user.uid === listing.user_id;

  const handleDelete = async () => {
    if (!listing) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "listings", listing.id));
      toast.success("Listing deleted successfully");
      router.push("/dashboard/my-listings");
    } catch {
      toast.error("Failed to delete listing");
    }
    setDeleting(false);
    setShowDeleteDialog(false);
  };

  const handleRequestPin = async () => {
    if (!listing) return;
    setSubmittingPin(true);
    try {
      const pinReqTime = new Date().toISOString();
      await updateDoc(doc(db, "listings", listing.id), {
        pin_status: "pending_approval",
        pin_payment_status: "pending",
        pin_payment_amount: 499,
        pin_requested_at: pinReqTime,
        updated_at: pinReqTime,
      });
      setListing((prev) => prev ? {
        ...prev,
        pin_status: "pending_approval",
        pin_payment_status: "pending",
        pin_payment_amount: 499,
        pin_requested_at: pinReqTime,
        updated_at: pinReqTime,
      } : null);
      toast.success("Pin request submitted! Admin will verify and pin your listing.");
      setShowPinDialog(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit pin request");
    } finally {
      setSubmittingPin(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data } = await getListingById(id);
      if (data) {
        setListing(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profiles = (data as any).profiles;
        if (profiles) setProfile(profiles);

        const sim = await getSimilarListings({ category: data.category, id: data.id });
        setSimilar(sim);

        try {
          const recentKey = "bhoomitayi_recently_viewed";
          let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
          recent = recent.filter((item: any) => item.id !== data.id);
          recent.unshift({ id: data.id, title: data.title, price: data.price, category: data.category, image: data.images?.[0] || "" });
          if (recent.length > 5) recent.pop();
          localStorage.setItem(recentKey, JSON.stringify(recent));
        } catch (e) {
          console.error("Local storage error:", e);
        }
      }
      setLoading(false);
    }

    load();
  }, [id]);



  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-96 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Listing Not Found</h1>
          <p className="text-muted-foreground mt-2">The service you are looking for does not exist.</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const details = (listing.details || {}) as Record<string, any>;
  const effectiveStatus = getEffectiveListingStatus(listing);
  const remainingMs = getRemainingTimeMs(listing.expires_at);
  const canReceiveInquiries = effectiveStatus === "active";

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-zinc-950 dark:via-zinc-900/80 dark:to-zinc-950">
      {/* Soft animated background elements */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none mix-blend-screen" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay pointer-events-none z-0" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link href={`/${listing.category === "house" ? "houses" : listing.category === "vehicle" ? "vehicles" : listing.category === "commodity" ? "commodities" : listing.category}`} className="hover:text-foreground transition-colors capitalize">
            {listing.category === "house" ? "Houses" : listing.category === "pg" ? "PG" : listing.category === "vehicle" ? "Vehicles" : listing.category === "commodity" ? "Other Commodities" : listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{listing.title}</span>
        </nav>

        {/* Image Gallery */}
        <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/5 backdrop-blur-3xl">
          <ImageGallery images={listing.images ?? []} title={listing.title} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 dark:border-white/10 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800">{listing.category}</Badge>
                      {listing.transaction_type && (
                        <Badge className="capitalize rounded-lg">{listing.transaction_type}</Badge>
                      )}
                      {effectiveStatus !== "active" && (
                        <Badge variant="destructive" className="capitalize rounded-lg">{effectiveStatus.replace("_", " ")}</Badge>
                      )}
                    </div>

                    {/* Translation Dropdown Bar */}
                    <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-200/40 dark:border-zinc-700/40 shrink-0">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        🌐 Translation:
                      </span>
                      <div className="flex gap-1">
                        {[
                          { code: "", label: "Original" },
                          { code: "en", label: "English" },
                          { code: "kn", label: "ಕನ್ನಡ" },
                          { code: "hi", label: "हिन्दी" },
                          { code: "ta", label: "தமிழ்" },
                          { code: "te", label: "తెలుగు" }
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            disabled={translating}
                            onClick={() => handleTranslate(lang.code)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                              translationLang === lang.code
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            } disabled:opacity-50`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                      {translating && (
                        <span className="text-[10px] text-blue-500 animate-pulse ml-1">Translating...</span>
                      )}
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{translatedTitle || listing.title}</h1>
                  <p className="flex items-center gap-1.5 text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {translatedAddress || listing.address}{listing.pincode ? ` - ${listing.pincode}` : ""}
                  </p>
                  <div className="mt-4">
                    <ListingCountdown
                      expiresAt={listing.expires_at}
                      status={effectiveStatus}
                      timerDuration={listing.timer_duration}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {listing.transaction_type && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-semibold text-blue-700 dark:text-blue-300 capitalize">
                      {listing.transaction_type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Key Details */}
            {Object.keys(details).length > 0 && (
              <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Service Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {listing.category === "house" && (
                  <>
                    <DetailItem icon={<Bed className="h-5 w-5" />} label="Bedrooms" value={String(details.bedrooms)} />
                    <DetailItem icon={<Bath className="h-5 w-5" />} label="Bathrooms" value={String(details.bathrooms)} />
                    <DetailItem icon={<Maximize className="h-5 w-5" />} label="Area" value={formatArea(details.area_sqft as number)} />
                    <DetailItem icon={<Home className="h-5 w-5" />} label="Furnishing" value={String(details.furnishing)} />
                    {details.floors && <DetailItem icon={<Building2 className="h-5 w-5" />} label="Floors" value={String(details.floors)} />}
                    {details.parking !== undefined && <DetailItem icon={<Car className="h-5 w-5" />} label="Parking" value={details.parking ? "Yes" : "No"} />}
                    {details.year_built && <DetailItem icon={<Calendar className="h-5 w-5" />} label="Year Built" value={String(details.year_built)} />}
                  </>
                )}
                {listing.category === "land" && (
                  <>
                    <DetailItem icon={<Maximize className="h-5 w-5" />} label="Area" value={formatArea(details.area_sqft as number)} />
                    <DetailItem icon={<Building2 className="h-5 w-5" />} label="Land Type" value={String(details.land_type)} />
                    {details.facing && <DetailItem icon={<Compass className="h-5 w-5" />} label="Facing" value={String(details.facing)} />}
                    {details.road_width_ft && <DetailItem icon={<Maximize className="h-5 w-5" />} label="Road Width" value={`${details.road_width_ft} ft`} />}
                    {details.boundary_wall !== undefined && <DetailItem icon={<Fence className="h-5 w-5" />} label="Boundary Wall" value={details.boundary_wall ? "Yes" : "No"} />}
                    {details.is_corner_plot !== undefined && <DetailItem icon={<MapPin className="h-5 w-5" />} label="Corner Plot" value={details.is_corner_plot ? "Yes" : "No"} />}
                    {details.legal_clearance !== undefined && <DetailItem icon={<Flag className="h-5 w-5" />} label="Legal Clearance" value={details.legal_clearance ? "Yes" : "No"} />}
                  </>
                )}
                {listing.category === "pg" && (
                  <>
                    <DetailItem icon={<Users className="h-5 w-5" />} label="Gender" value={String(details.gender_preference)} />
                    <DetailItem icon={<Bed className="h-5 w-5" />} label="Occupancy" value={String(details.occupancy_type)} />
                    <DetailItem icon={<UtensilsCrossed className="h-5 w-5" />} label="Meals" value={details.meals_included ? "Included" : "Not Included"} />
                    {details.wifi !== undefined && <DetailItem icon={<Wifi className="h-5 w-5" />} label="WiFi" value={details.wifi ? "Yes" : "No"} />}
                    {details.ac !== undefined && <DetailItem icon={<Wind className="h-5 w-5" />} label="AC" value={details.ac ? "Yes" : "No"} />}
                    {details.attached_bathroom !== undefined && <DetailItem icon={<ShowerHead className="h-5 w-5" />} label="Attached Bath" value={details.attached_bathroom ? "Yes" : "No"} />}
                    <DetailItem icon={<Calendar className="h-5 w-5" />} label="Available From" value={String(details.available_from)} />
                    <DetailItem icon={<Maximize className="h-5 w-5" />} label="Deposit" value={formatPrice(details.security_deposit as number)} />
                  </>
                )}
                {listing.category === "commercial" && (
                  <>
                    <DetailItem icon={<Building2 className="h-5 w-5" />} label="Type" value={String(details.commercial_type)} />
                    <DetailItem icon={<Maximize className="h-5 w-5" />} label="Area" value={formatArea(details.area_sqft as number)} />
                    <DetailItem icon={<Home className="h-5 w-5" />} label="Furnishing" value={String(details.furnishing)} />
                    {details.floors && <DetailItem icon={<Building2 className="h-5 w-5" />} label="Floors" value={String(details.floors)} />}
                    {details.parking !== undefined && <DetailItem icon={<Car className="h-5 w-5" />} label="Parking" value={details.parking ? "Yes" : "No"} />}
                    {details.power_backup !== undefined && <DetailItem icon={<Wind className="h-5 w-5" />} label="Power Backup" value={details.power_backup ? "Yes" : "No"} />}
                    {details.lift !== undefined && <DetailItem icon={<Building2 className="h-5 w-5" />} label="Lift" value={details.lift ? "Yes" : "No"} />}
                  </>
                )}
                {listing.category === "vehicle" && (
                  <>
                    <DetailItem icon={<Car className="h-5 w-5" />} label="Type" value={String(details.vehicle_type)} />
                    <DetailItem icon={<Package className="h-5 w-5" />} label="Brand" value={String(details.brand)} />
                    <DetailItem icon={<Settings2 className="h-5 w-5" />} label="Model" value={String(details.model)} />
                    <DetailItem icon={<Calendar className="h-5 w-5" />} label="Year" value={String(details.year)} />
                    {details.fuel_type && <DetailItem icon={<Fuel className="h-5 w-5" />} label="Fuel Type" value={String(details.fuel_type)} />}
                    {details.transmission && <DetailItem icon={<Settings2 className="h-5 w-5" />} label="Transmission" value={String(details.transmission)} />}
                    {details.km_driven != null && <DetailItem icon={<Gauge className="h-5 w-5" />} label="KM Driven" value={`${Number(details.km_driven).toLocaleString("en-IN")} km`} />}
                    {details.owner_number != null && <DetailItem icon={<Users className="h-5 w-5" />} label="Owner Number" value={String(details.owner_number)} />}
                    {details.registration_state && <DetailItem icon={<MapPin className="h-5 w-5" />} label="Registration State" value={String(details.registration_state)} />}
                    {details.insurance_valid !== undefined && <DetailItem icon={<ShieldCheck className="h-5 w-5" />} label="Insurance" value={details.insurance_valid ? "Valid" : "Expired / NA"} />}
                  </>
                )}
                {listing.category === "commodity" && (
                  <>
                    <DetailItem icon={<Package className="h-5 w-5" />} label="Type" value={String(details.commodity_type)} />
                    {details.brand && <DetailItem icon={<Building2 className="h-5 w-5" />} label="Brand" value={String(details.brand)} />}
                    <DetailItem icon={<ShieldCheck className="h-5 w-5" />} label="Condition" value={String(details.condition).replace("_", " ")} />
                    {details.warranty !== undefined && <DetailItem icon={<ShieldCheck className="h-5 w-5" />} label="Warranty" value={details.warranty ? "Yes" : "No"} />}
                    {details.age_months != null && <DetailItem icon={<Calendar className="h-5 w-5" />} label="Age" value={`${details.age_months} months`} />}
                  </>
                )}
              </div>
              </div>
            )}

            <ListingTools 
              listingPrice={listing.price ?? 0} 
              description={listing.description || ""} 
              area={Number(details.area_sqft) || undefined}
              category={listing.category}
            />

            {/* Description */}
            <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d">
              <h2 className="text-xl font-semibold mb-3 text-foreground flex justify-between items-center">
                Description
                <span className="text-xs font-normal bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full text-muted-foreground">
                  {Math.max(1, Math.ceil((listing.description?.split(/\s+/).length || 1) / 200))} min read
                </span>
              </h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{translatedDesc || listing.description}</p>
            </div>

            {/* Amenities */}
            {details.amenities && Array.isArray(details.amenities) && (details.amenities as string[]).length > 0 && (
              <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d">
                <h2 className="text-xl font-semibold mb-3 text-foreground">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {(details.amenities as string[]).map((amenity: string) => (
                    <Badge key={amenity} variant="outline" className="capitalize rounded-lg px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {listing.category === "pg" && details.rules && (
              <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d">
                <h2 className="text-xl font-semibold mb-3 text-foreground">House Rules</h2>
                <p className="text-muted-foreground leading-relaxed">{String(details.rules)}</p>
              </div>
            )}

            {listing.category === "pg" && details.meal_types && Array.isArray(details.meal_types) && (
              <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d">
                <h2 className="text-xl font-semibold mb-3 text-foreground">Meals Provided</h2>
                <div className="flex flex-wrap gap-2">
                  {(details.meal_types as string[]).map((meal: string) => (
                    <Badge key={meal} variant="outline" className="capitalize rounded-lg px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50">{meal}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <FavoriteButton listingId={listing.id} size="default" variant="outline" />
              <ShareButton title={listing.title} />
              <QrButton title={listing.title} />
              <FlyerButton listing={listing} />
              <ReportButton listingId={listing.id} />
              {isOwner && (
                <>
                  <Button
                    variant="destructive"
                    size="default"
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-1.5"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (listing.pinned) {
                        toast.info("Your listing is already pinned!");
                      } else if (listing.pin_status === "pending_approval") {
                        toast.info("Your pin request is pending admin verification.");
                      } else {
                        setShowPinDialog(true);
                      }
                    }}
                    className="gap-1 px-3 border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-950/50"
                  >
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      {listing.pinned ? (
                        <>📌 Active</>
                      ) : listing.pin_status === "pending_approval" ? (
                        <>⏳ Pending</>
                      ) : (
                        <>📌 Pin</>
                      )}
                    </span>
                  </Button>
                </>
              )}
            </div>

            {profile && (
              <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-gradient-to-br from-white/80 to-white/40 dark:from-zinc-900/80 dark:to-zinc-900/40 backdrop-blur-3xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <CardContent className="p-8 space-y-6 relative z-10">
                  <div>
                    <h3 className="font-bold text-xl text-foreground flex items-center gap-2 mb-4">
                      Contact Details
                    </h3>
                    
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-zinc-100 dark:border-zinc-800/50 mb-6">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-background" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl shadow-sm border border-blue-200/50 dark:border-blue-800/50">
                          {profile.full_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg text-foreground leading-tight">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">Verified Seller</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(profile.phone || listing.owner_phone) && (
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                            <Phone className="size-4" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Phone Number</p>
                            <a href={`tel:${formatPhoneWithCountryCode(profile.phone || listing.owner_phone || "")}`} className="text-sm font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{formatPhoneWithCountryCode(profile.phone || listing.owner_phone || "")}</a>
                          </div>
                        </div>
                      )}

                      {(profile.email || listing.owner_email) && (
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                            <Mail className="size-4" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Email Address</p>
                            <a href={`mailto:${profile.email || listing.owner_email}`} className="text-sm font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block max-w-[180px]">
                              {profile.email || listing.owner_email}
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                          <MapPin className="size-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Location</p>
                          <p className="text-sm font-semibold text-foreground leading-snug">{translatedAddress || listing.address}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                          <Calendar className="size-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Posted On</p>
                          <p className="text-sm font-semibold text-foreground">{(() => { const d = new Date(listing.created_at); return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} ${d.getFullYear()}`; })()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-8">
                      {(profile.phone || listing.owner_phone) && (
                        <>
                          <Button 
                            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md font-bold h-11"
                            onClick={() => window.location.href = `tel:${formatPhoneWithCountryCode(profile.phone || listing.owner_phone || "")}`}
                          >
                            <Phone className="mr-2 size-4" />
                            Call
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full rounded-xl border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold h-11"
                            onClick={() => {
                              const ph = formatPhoneWithCountryCode(profile.phone || listing.owner_phone || "");
                              if (ph) window.open(`https://wa.me/${ph.replace(/\D/g, '')}`, '_blank');
                            }}
                          >
                            <svg className="mr-2 size-4 fill-current" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Chat
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!canReceiveInquiries && (
              <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
                <CardContent className="py-4">
                  <p className="font-medium text-foreground">Contact unavailable</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This listing is currently {effectiveStatus.replace("_", " ")}.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Similar Listings */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Similar Properties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similar.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pin confirmation payment dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="max-w-[450px] bg-[#111111] border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <span>📌</span> Pin Listing to Top
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Boost your listing to appear at the very top of search results and the homepage for 30 days.
            </DialogDescription>
          </DialogHeader>

          {/* QR Scan Details */}
          <div className="space-y-6 py-6 flex flex-col items-center">
            <div className="text-center">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">PROMOTION PLAN</p>
              <h3 className="text-2xl font-black text-white">1-Month Pin Placement</h3>
              <p className="text-4xl font-black text-amber-400 mt-2">₹499</p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-3xl w-56 h-56 flex items-center justify-center shadow-lg border-4 border-amber-500">
              <QRCodeSVG
                value="upi://pay?pa=amoghabhat7403@oksbi&pn=BhoomiTayi&am=499&cu=INR"
                size={190}
                level="Q"
              />
            </div>

            <div className="text-center space-y-2">
              <p className="text-xs text-zinc-400">Scan QR Code with any UPI app (GPay, PhonePe, Paytm)</p>
              <div className="flex items-center justify-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl max-w-xs mx-auto">
                <span className="text-xs font-mono select-all truncate max-w-[200px]">amoghabhat7403@oksbi</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400" onClick={() => {
                  navigator.clipboard.writeText("amoghabhat7403@oksbi");
                  toast.success("UPI ID copied!");
                }}>
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1 rounded-xl border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900" onClick={() => setShowPinDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl" onClick={handleRequestPin} disabled={submittingPin}>
              {submittingPin ? "Submitting..." : "I've Paid, Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="group flex items-center gap-4 p-4 bg-white/50 dark:bg-zinc-800/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-center size-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-all duration-300">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">{label}</p>
        <p className="font-semibold capitalize text-foreground">{value}</p>
      </div>
    </div>
  );
}
