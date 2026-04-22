"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Bed, Bath, Maximize, Building2, Car, Package, Clock } from "lucide-react";
import { motion } from "framer-motion";

import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { formatPrice } from "@/lib/constants";
import type {
  Listing,
  HouseDetails,
  LandDetails,
  PGDetails,
  CommercialDetails,
  VehicleDetails,
  CommodityDetails,
} from "@/lib/types/database";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ListingCardProps {
  listing: Listing;
  showFavorite?: boolean;
  viewMode?: "grid" | "list";
}

const categoryColors: Record<string, string> = {
  house: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  land: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800",
  pg: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  commercial: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  vehicle: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  commodity: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
};

const transactionColors: Record<string, string> = {
  buy: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  sell: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  rent: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
};

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
    <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md shadow-lg border border-white/20">
      <Clock className="size-3" />
      <span>
        {timeLeft.d > 0 && `${timeLeft.d}d `}
        {String(timeLeft.h).padStart(2, "0")}:
        {String(timeLeft.m).padStart(2, "0")}:
        {String(timeLeft.s).padStart(2, "0")}
      </span>
    </div>
  );
}

export function ListingCard({ listing, showFavorite = true, viewMode = "grid" }: ListingCardProps) {
  const { user, profile } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteDocId, setFavoriteDocId] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const isAdmin = profile?.role === "admin";

  const handleExpire = useCallback(async () => {
    setIsExpired(true);
    if (listing.status === "active") {
      try {
        await updateDoc(doc(db, "listings", listing.id), {
          status: "timed_out",
        });
      } catch (error) {
        console.error("Failed to update status on expiry:", error);
      }
    }
  }, [listing.id, listing.status]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const primaryImage = listing.images?.[0] && typeof listing.images[0] === "string" ? listing.images[0] : null;
  const [imageError, setImageError] = useState(false);
  const details = listing.details as Record<string, unknown> | null;

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  useEffect(() => {
    if (!user || !showFavorite) return;

    const checkFavorite = async () => {
      const favRef = collection(db, "favorites");
      const q = query(favRef, where("user_id", "==", user.uid), where("listing_id", "==", listing.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setIsFavorited(true);
        setFavoriteDocId(snapshot.docs[0].id);
      }
    };

    checkFavorite();
  }, [user, listing.id, showFavorite]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;
    if (favoriteLoading) return;

    setFavoriteLoading(true);

    try {
      if (isFavorited && favoriteDocId) {
        await deleteDoc(doc(db, "favorites", favoriteDocId));
        setIsFavorited(false);
        setFavoriteDocId(null);
      } else {
        const docRef = await addDoc(collection(db, "favorites"), {
          user_id: user.uid,
          listing_id: listing.id,
          created_at: new Date().toISOString(),
        });
        setIsFavorited(true);
        setFavoriteDocId(docRef.id);
      }
    } catch {
      // Silently handle error
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setRotateX(-(e.clientY - centerY) / 30);
    setRotateY((e.clientX - centerX) / 30);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const renderDetails = () => {
    if (!details) return null;

    switch (listing.category) {
      case "house": {
        const d = details as unknown as HouseDetails;
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {d.bedrooms != null && (
              <span className="flex items-center gap-1">
                <Bed className="size-3.5" />
                {d.bedrooms} Beds
              </span>
            )}
            {d.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="size-3.5" />
                {d.bathrooms} Baths
              </span>
            )}
            {d.area_sqft != null && (
              <span className="flex items-center gap-1">
                <Maximize className="size-3.5" />
                {d.area_sqft.toLocaleString("en-IN")} sq.ft
              </span>
            )}
          </div>
        );
      }
      case "land": {
        const d = details as unknown as LandDetails;
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {d.area_sqft != null && (
              <span className="flex items-center gap-1">
                <Maximize className="size-3.5" />
                {d.area_sqft.toLocaleString("en-IN")} sq.ft
              </span>
            )}
            {d.land_type && (
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5" />
                {d.land_type.charAt(0).toUpperCase() + d.land_type.slice(1)}
              </span>
            )}
          </div>
        );
      }
      case "pg": {
        const d = details as unknown as PGDetails;
        return (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {d.rent_per_month != null && (
              <span className="font-medium text-foreground">
                {formatPrice(d.rent_per_month)}/mo
              </span>
            )}
            {d.gender_preference && (
              <span className="capitalize">{d.gender_preference}</span>
            )}
            {d.occupancy_type && (
              <span className="capitalize">{d.occupancy_type}</span>
            )}
          </div>
        );
      }
      case "commercial": {
        const d = details as unknown as CommercialDetails;
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {d.area_sqft != null && (
              <span className="flex items-center gap-1">
                <Maximize className="size-3.5" />
                {d.area_sqft.toLocaleString("en-IN")} sq.ft
              </span>
            )}
            {d.commercial_type && (
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5" />
                {d.commercial_type.charAt(0).toUpperCase() +
                  d.commercial_type.slice(1)}
              </span>
            )}
          </div>
        );
      }
      case "vehicle": {
        const d = details as unknown as VehicleDetails;
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {d.brand && d.model && (
              <span className="flex items-center gap-1">
                <Car className="size-3.5" />
                {d.brand} {d.model}
              </span>
            )}
            {d.year != null && (
              <span>{d.year}</span>
            )}
            {d.km_driven != null && (
              <span>{d.km_driven.toLocaleString("en-IN")} km</span>
            )}
          </div>
        );
      }
      case "commodity": {
        const d = details as unknown as CommodityDetails;
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {d.commodity_type && (
              <span className="flex items-center gap-1">
                <Package className="size-3.5" />
                {d.commodity_type.charAt(0).toUpperCase() + d.commodity_type.slice(1)}
              </span>
            )}
            {d.condition && (
              <span className="capitalize">{d.condition.replace("_", " ")}</span>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Hide if expired and not admin
  if ((isExpired || listing.status === "timed_out") && !isAdmin) {
    return null;
  }

  return (
    <Link href={`/listing/${listing.id}`}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ perspective: 800, transformStyle: "preserve-3d" }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="group overflow-hidden p-0 transition-all duration-400 shadow-3d border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-200 dark:hover:border-blue-800/60 rounded-2xl bg-white dark:bg-zinc-900/80 backdrop-blur-sm">
          {/* Image */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
            {primaryImage && !imageError ? (
              primaryImage.startsWith("data:") ? (
                <img
                  src={primaryImage}
                  alt={listing.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={handleImageError}
                />
              ) : (
                <Image
                  src={primaryImage}
                  alt={listing.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onError={handleImageError}
                />
              )
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                <Building2 className="size-12 text-muted-foreground/30" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 items-start">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className={`${categoryColors[listing.category]} text-xs font-semibold border backdrop-blur-md`}
                >
                  {listing.category === "pg"
                    ? "PG"
                    : listing.category.charAt(0).toUpperCase() +
                      listing.category.slice(1)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`${transactionColors[listing.transaction_type]} text-xs font-semibold border backdrop-blur-md`}
                >
                  {listing.transaction_type.charAt(0).toUpperCase() +
                    listing.transaction_type.slice(1)}
                </Badge>
              </div>
              
              {listing.status === "active" && listing.expires_at && (
                <CountdownTimer expiresAt={listing.expires_at} onExpire={handleExpire} />
              )}
              
              {listing.status === "timed_out" && (
                <Badge variant="destructive" className="text-[10px] font-bold backdrop-blur-md">
                  Timed Out
                </Badge>
              )}
            </div>

            {showFavorite && user && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2.5 top-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 shadow-lg transition-transform hover:scale-110 active:scale-95"
                onClick={toggleFavorite}
                disabled={favoriteLoading}
              >
                <Heart
                  className={`size-4 transition-colors ${
                    isFavorited
                      ? "fill-red-500 text-red-500"
                      : "text-muted-foreground"
                  }`}
                />
                <span className="sr-only">
                  {isFavorited ? "Remove from favorites" : "Add to favorites"}
                </span>
              </Button>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex flex-col gap-2 p-4">
            <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {formatPrice(listing.price)}
            </p>

            <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground">
              {listing.title}
            </h3>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
              <span className="line-clamp-1">
                {listing.address}
              </span>
            </div>

            {renderDetails()}
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
