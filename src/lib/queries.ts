import type { ListingCategory, TransactionType, Listing } from "@/lib/types/database";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { isListingPubliclyVisible } from "@/lib/listing-timer";

import type { QueryConstraint } from "firebase/firestore";

interface ListingsQueryParams {
  category: ListingCategory;
  transactionType?: TransactionType;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  search?: string;
}

export async function getListings(params: ListingsQueryParams) {
  try {
    const listingsRef = collection(db, "listings");
    const page = params.page || 1;
    const pageSize = ITEMS_PER_PAGE;

    const baseConstraints: QueryConstraint[] = [
      where("category", "==", params.category),
      where("status", "==", "active"),
    ];

    if (params.transactionType) {
      baseConstraints.push(where("transaction_type", "==", params.transactionType));
    }

    const hasPriceFilter = !!(params.minPrice || params.maxPrice);
    let sortConstraint: QueryConstraint;

    if (hasPriceFilter || params.sort === "price_asc" || params.sort === "price_desc") {
      sortConstraint = orderBy(
        "price",
        params.sort === "price_desc" ? "desc" : "asc"
      );
    } else {
      sortConstraint =
        params.sort === "oldest"
          ? orderBy("created_at", "asc")
          : orderBy("created_at", "desc");
    }

    const filterConstraints: QueryConstraint[] = [];
    if (params.minPrice) {
      filterConstraints.push(where("price", ">=", params.minPrice));
    }
    if (params.maxPrice) {
      filterConstraints.push(where("price", "<=", params.maxPrice));
    }

    const q = query(listingsRef, ...baseConstraints, ...filterConstraints, sortConstraint);
    const snapshot = await getDocs(q);

    const allListings = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Listing)
      .filter(isListingPubliclyVisible);

    const count = allListings.length;
    const startIndex = (page - 1) * pageSize;
    const data = allListings.slice(startIndex, startIndex + pageSize);

    return { data, count, error: null };
  } catch (error) {
    console.error("Error fetching listings:", error);
    return { data: [], count: 0, error };
  }
}

export async function getListingById(id: string) {
  try {
    const docRef = doc(db, "listings", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { data: null, error: "Not found" };
    }

    const listing = { id: docSnap.id, ...docSnap.data() } as Listing & {
      profiles?: { full_name: string; phone: string | null; avatar_url: string | null };
    };

    if (listing.user_id) {
      const profileRef = doc(db, "profiles", listing.user_id);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        listing.profiles = profileSnap.data() as {
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
        };
      }
    }

    return { data: listing, error: null };
  } catch (error) {
    console.error("Error fetching listing:", error);
    return { data: null, error };
  }
}

export async function getSimilarListings(listing: { category: string; id: string }) {
  try {
    const listingsRef = collection(db, "listings");
    const q = query(
      listingsRef,
      where("category", "==", listing.category),
      where("status", "==", "active"),
      orderBy("created_at", "desc"),
      limit(8)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Listing)
      .filter(isListingPubliclyVisible)
      .filter((item) => item.id !== listing.id)
      .slice(0, 4);
  } catch (error) {
    console.error("Error fetching similar listings:", error);
    return [];
  }
}

export async function getFeaturedListings() {
  try {
    const listingsRef = collection(db, "listings");
    const q = query(
      listingsRef,
      where("status", "==", "active"),
      orderBy("created_at", "desc"),
      limit(24)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Listing)
      .filter(isListingPubliclyVisible)
      .slice(0, 8);
  } catch (error) {
    console.error("Error fetching featured listings:", error);
    return [];
  }
}
