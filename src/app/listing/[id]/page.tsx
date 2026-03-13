"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getListingById, getSimilarListings } from "@/lib/queries";
import { ImageGallery } from "@/components/listings/image-gallery";
import { InquiryForm } from "@/components/listings/inquiry-form";
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
  MapPin, Bed, Bath, Maximize, Calendar, Car, Wifi,
  Wind, ShowerHead, Building2, Fence, Compass,
  Users, UtensilsCrossed, Home, ChevronRight, Flag,
  Gauge, Fuel, Settings2, Package, ShieldCheck, Trash2,
} from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/lib/types/database";
import { ReportButton } from "@/components/listings/report-button";
import { ShareButton } from "@/components/listings/share-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuthStore();

  const [listing, setListing] = useState<Listing | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; phone: string | null; avatar_url: string | null } | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
                      <Badge variant="destructive" className="capitalize rounded-lg">{listing.status}</Badge>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{listing.title}</h1>
                  <p className="flex items-center gap-1.5 text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {listing.address} - {listing.pincode}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{formatPrice(listing.price)}</p>
                  {listing.transaction_type === "rent" && (
                    <p className="text-sm text-muted-foreground">/month</p>
                  )}
                </div>
              </div>
            </div>

            {/* Key Details */}
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
              {isOwner && (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
            </div>

            {profile && (
              <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
                <CardContent className="py-4">
                  <p className="font-semibold text-foreground">{profile.full_name}</p>
                </CardContent>
              </Card>
            )}

            <InquiryForm
              listingId={listing.id}
              ownerName={profile?.full_name || "Owner"}
            />
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
