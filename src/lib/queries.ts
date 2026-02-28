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
  getCountFromServer,
  startAfter,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

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

    // Build base equality constraints (these always work together)
    const baseConstraints: QueryConstraint[] = [
      where("category", "==", params.category),
      where("status", "==", "active"),
    ];

    if (params.transactionType) {
      baseConstraints.push(where("transaction_type", "==", params.transactionType));
    }

    // Determine sort order
    // When price filters are used, we must order by price first (Firestore requirement)
    const hasPriceFilter = !!(params.minPrice || params.maxPrice);
    let sortConstraint: QueryConstraint;

    if (hasPriceFilter || params.sort === "price_asc" || params.sort === "price_desc") {
      // Use price ordering when price filters or price sort is active
      const direction = params.sort === "price_desc" ? "desc" as const : "asc" as const;
      sortConstraint = orderBy("price", direction);
    } else {
      switch (params.sort) {
        case "oldest":
          sortConstraint = orderBy("created_at", "asc");
          break;
        default:
          sortConstraint = orderBy("created_at", "desc");
      }
    }

    // Build filter constraints
    const filterConstraints: QueryConstraint[] = [];
    if (params.minPrice) {
      filterConstraints.push(where("price", ">=", params.minPrice));
    }
    if (params.maxPrice) {
      filterConstraints.push(where("price", "<=", params.maxPrice));
    }

    // Count query (without price filters for simplicity — gives total in category)
    const countQuery = query(listingsRef, ...baseConstraints);
    const countSnapshot = await getCountFromServer(countQuery);
    const count = countSnapshot.data().count;

    // For pagination: fetch documents up to the current page
    // Use a simpler approach — fetch all up to current page end, then slice last page
    const allConstraints = [...baseConstraints, ...filterConstraints, sortConstraint];
    const fetchLimit = pageSize * page;
    const q = query(listingsRef, ...allConstraints, limit(fetchLimit));
    const snapshot = await getDocs(q);

    const allDocs = snapshot.docs;
    const startIndex = (page - 1) * pageSize;
    const paginatedDocs = allDocs.slice(startIndex, startIndex + pageSize);

    const data: Listing[] = paginatedDocs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Listing[];

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
      limit(5)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Listing)
      .filter((item) => item.id !== listing.id)
      .slice(0, 4);

    return data;
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
      limit(8)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing);
  } catch (error) {
    console.error("Error fetching featured listings:", error);
    return [];
  }
}
