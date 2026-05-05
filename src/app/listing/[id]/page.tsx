"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getListingById, getSimilarListings } from "@/lib/queries";
import { ImageGallery } from "@/components/listings/image-gallery";
import { InquiryForm } from "@/components/listings/inquiry-form";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { ListingCard } from "@/components/listings/listing-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatArea } from "@/lib/constants";
import { useAuthStore } from "@/lib/store";
import {
  MapPin, Bed, Bath, Maximize, Calendar, Car, Wifi,
  Wind, ShowerHead, Building2, Fence, Compass,
  Users, UtensilsCrossed, Home, ChevronRight, Flag,
  Gauge, Fuel, Settings2, Package, ShieldCheck, Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/lib/types/database";
import { ReportButton } from "@/components/listings/report-button";
import { ShareButton } from "@/components/listings/share-button";
import { Skeleton } from "@/components/ui/skeleton";

// Countdown Timer Component
function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiresAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        onExpire();
        return null;
      }

      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      };
    };

    const initial = calculateTimeLeft();
    if (initial) setTimeLeft(initial);
    
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (!remaining) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 px-4 py-2 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-mono font-bold">
      <Clock className="size-5" />
      <div className="flex gap-2">
        <div className="flex flex-col items-center">
          <span className="text-xl">{String(timeLeft.d).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase font-sans">Days</span>
        </div>
        <span className="text-xl">:</span>
        <div className="flex flex-col items-center">
          <span className="text-xl">{String(timeLeft.h).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase font-sans">Hrs</span>
        </div>
        <span className="text-xl">:</span>
        <div className="flex flex-col items-center">
          <span className="text-xl">{String(timeLeft.m).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase font-sans">Min</span>
        </div>
        <span className="text-xl">:</span>
        <div className="flex flex-col items-center">
          <span className="text-xl">{String(timeLeft.s).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase font-sans">Sec</span>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { profile: authProfile } = useAuthStore();
  const isAdmin = authProfile?.role === "admin";

  const [listing, setListing] = useState<Listing | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<{ full_name: string; phone: string | null; avatar_url: string | null } | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  const handleExpire = useCallback(async () => {
    setIsExpired(true);
    if (listing && listing.status === "active") {
      try {
        await updateDoc(doc(db, "listings", listing.id), {
          status: "timed_out",
        });
      } catch (error) {
        console.error("Failed to update status on expiry:", error);
      }
    }
  }, [listing]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data } = await getListingById(id);
      if (data) {
        setListing(data);
        if (data.status === "timed_out") setIsExpired(true);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profiles = (data as any).profiles;
        if (profiles) setOwnerProfile(profiles);

        const sim = await getSimilarListings({ category: data.category, id: data.id });
        setSimilar(sim);
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
          <p className="text-muted-foreground mt-2">The property you are looking for does not exist.</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  // Handle expired state for non-admins
  if ((isExpired || listing.status === "timed_out") && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-orange-50 dark:bg-orange-950/20 p-8 rounded-3xl border border-orange-200 dark:border-orange-800/30 max-w-md shadow-3d">
          <div className="bg-orange-100 dark:bg-orange-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="size-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Listing Timed Out</h1>
          <p className="text-muted-foreground mb-8">This listing has reached its time limit and is no longer active. Please contact the owner or search for similar properties.</p>
          <Link href="/" className="inline-flex items-center justify-center h-11 px-8 font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const details = listing.details as Record<string, any>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

        {/* Expiry Warning for Admin */}
        {isAdmin && isExpired && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="size-5" />
            <p className="font-medium">Admin View: This listing has timed out and is hidden from public view.</p>
          </div>
        )}

        {/* Image Gallery */}
        <ImageGallery images={listing.images ?? []} title={listing.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="capitalize rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800">{listing.category}</Badge>
                    <Badge className="capitalize rounded-lg">{listing.transaction_type}</Badge>
                    {listing.status !== "active" && (
                      <Badge variant="destructive" className="capitalize rounded-lg">{listing.status.replace("_", " ")}</Badge>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{listing.title}</h1>
                  <p className="flex items-center gap-1.5 text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {listing.address} - {listing.pincode}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-3 flex flex-col items-end">
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{formatPrice(listing.price)}</p>
                  {listing.transaction_type === "rent" && (
                    <p className="text-sm text-muted-foreground">/month</p>
                  )}
                  
                  {listing.status === "active" && listing.expires_at && (
                    <CountdownTimer expiresAt={listing.expires_at} onExpire={handleExpire} />
                  )}
                </div>
              </div>
            </div>

            {/* Key Details */}
            <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Property Details</h2>
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

            {/* Description */}
            <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d">
              <h2 className="text-xl font-semibold mb-3 text-foreground">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{listing.description}</p>
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
              <ReportButton listingId={listing.id} />
            </div>

            {ownerProfile && (
              <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">Posted by</h3>
                    <div className="flex items-center gap-3 mt-3">
                      {ownerProfile.avatar_url ? (
                        <img src={ownerProfile.avatar_url} alt={ownerProfile.full_name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                          {ownerProfile.full_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{ownerProfile.full_name}</p>
                        {ownerProfile.phone && (
                          <a href={`tel:${ownerProfile.phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-0.5 block">{ownerProfile.phone}</a>
                        )}
                      </div>
                    </div>
                  </div>
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
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80 transition-colors">
      <div className="text-blue-500 dark:text-blue-400">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium capitalize text-foreground">{value}</p>
      </div>
    </div>
  );
}
