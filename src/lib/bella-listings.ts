import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { isListingPubliclyVisible } from "@/lib/listing-timer";
import type { Listing } from "@/lib/types/database";
import { matchesBellaSearch, type BellaSearch } from "@/lib/bella-search";

export async function findBellaListings(filters: BellaSearch) {
  if (!filters.category) return { listings: [], sampled: false };
  // No composite ordering index required. Never read private or pending listings.
  const snapshot = await getDocs(
    query(
      collection(db, "listings"),
      where("category", "==", filters.category),
      where("status", "==", "active"),
      limit(120),
    ),
  );
  const listings = snapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id }) as Listing)
    .filter(isListingPubliclyVisible)
    .filter((listing) => matchesBellaSearch(listing, filters));
  return { listings: listings.slice(0, 6), sampled: snapshot.size === 120 };
}
