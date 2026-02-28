"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { formatPrice } from "@/lib/constants";
import type { Listing } from "@/lib/types/database";

interface FavoriteWithListing {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing: Listing | null;
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteWithListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const favsQuery = query(
          collection(db, "favorites"),
          where("user_id", "==", user.uid)
        );
        const favsSnap = await getDocs(favsQuery);

        const favsWithListings: FavoriteWithListing[] = [];

        for (const favDoc of favsSnap.docs) {
          const favData = favDoc.data();
          let listing: Listing | null = null;

          if (favData.listing_id) {
            const listingDoc = await getDoc(
              doc(db, "listings", favData.listing_id)
            );
            if (listingDoc.exists()) {
              listing = { id: listingDoc.id, ...listingDoc.data() } as Listing;
            }
          }

          favsWithListings.push({
            id: favDoc.id,
            user_id: favData.user_id,
            listing_id: favData.listing_id,
            created_at: favData.created_at,
            listing,
          });
        }

        setFavorites(favsWithListings);
      } catch {
        toast.error("Failed to fetch favorites");
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user, authLoading]);

  const handleRemove = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, "favorites", favoriteId));
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast.success("Removed from favorites");
    } catch {
      toast.error("Failed to remove favorite");
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Favorites</h1>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              No favorites yet
            </p>
            <p className="text-sm text-muted-foreground">
              Listings you favorite will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const listing = fav.listing;
            if (!listing) return null;

            return (
              <Card key={fav.id} className="overflow-hidden rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative h-48 w-full">
                  {listing.images && listing.images.length > 0 ? (
                    listing.images[0].startsWith("data:") ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 capitalize">
                    {listing.category}
                  </Badge>
                </div>
                <CardContent className="flex flex-col gap-2 pt-4">
                  <Link
                    href={`/listing/${listing.id}`}
                    className="font-semibold hover:underline"
                  >
                    {listing.title}
                  </Link>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {listing.address}
                  </div>
                  <p className="text-lg font-bold">
                    {formatPrice(listing.price)}
                    {listing.transaction_type === "rent" && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /month
                      </span>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleRemove(fav.id)}
                  >
                    <Heart className="size-4 fill-red-500 text-red-500" />
                    Remove from Favorites
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
