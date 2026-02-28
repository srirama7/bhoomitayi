import type { ListingCategory, TransactionType, Listing } from "@/lib/types/database";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import {
  db,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  type QueryConstraint,
} from "@/lib/firebase/firestore";

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
    const constraints: QueryConstraint[] = [
      where("category", "==", params.category),
      where("status", "==", "active"),
    ];

    if (params.transactionType) {
      constraints.push(where("transaction_type", "==", params.transactionType));
    }
    if (params.minPrice) {
      constraints.push(where("price", ">=", params.minPrice));
    }
    if (params.maxPrice) {
      constraints.push(where("price", "<=", params.maxPrice));
    }

    // Sorting
    switch (params.sort) {
      case "price_asc":
        constraints.push(orderBy("price", "asc"));
        break;
      case "price_desc":
        constraints.push(orderBy("price", "desc"));
        break;
      case "oldest":
        constraints.push(orderBy("created_at", "asc"));
        break;
      default:
        constraints.push(orderBy("created_at", "desc"));
    }

    const listingsRef = collection(db, "listings");

    // Get total count
    const countQuery = query(
      listingsRef,
      where("category", "==", params.category),
      where("status", "==", "active"),
      ...(params.transactionType ? [where("transaction_type", "==", params.transactionType)] : [])
    );
    const countSnapshot = await getCountFromServer(countQuery);
    const count = countSnapshot.data().count;

    // Get paginated data
    const page = params.page || 1;
    const pageSize = ITEMS_PER_PAGE;
    const q = query(listingsRef, ...constraints, limit(pageSize * page));
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

    // Fetch the owner's profile
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
