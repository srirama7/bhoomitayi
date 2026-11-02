import type { Listing, ListingCategory } from "@/lib/types/database";

export interface BellaSearch {
  category?: ListingCategory;
  location?: string;
  maxPrice?: number;
  bedrooms?: number;
  transaction?: "rent" | "buy";
}

const categories: [ListingCategory, RegExp][] = [
  ["pg", /\b(pg|pgs|hostels?|paying guest)\b/i],
  ["commercial", /\b(commercial|offices?|shops?|warehouses?)\b/i],
  ["land", /\b(land|plots?|sites?)\b/i],
  ["vehicle", /\b(vehicles?|cars?|bikes?|scooters?)\b/i],
  ["commodity", /\b(commodities|commodity|furniture|electronics)\b/i],
  ["house", /\b(houses?|homes?|flats?|apartments?|villas?|bhk)\b|[1-9]\s*bhk\b|ಮನೆ|मकान/i],
];

export const categoryPaths: Record<ListingCategory, string> = {
  house: "/houses",
  land: "/land",
  pg: "/pg",
  commercial: "/commercial",
  vehicle: "/vehicles",
  commodity: "/commodities",
};

/** Parse only search requests; questions and commands continue to the intent engine. */
export function parseBellaSearch(
  message: string,
  previous: BellaSearch = {},
): BellaSearch | null {
  if (
    /\b(how|what|why|tips|guide|help|sell|selling|register|documents?|calculator|calc|convert|mode|theme|language|write|draft|description|list my|my listings|go|open|navigate)\b/i.test(
      message,
    )
  )
    return null;
  const category = categories.find(([, pattern]) => pattern.test(message))?.[0];
  const budget = message.match(
    /(?:under|below|up to|upto|max(?:imum)?|budget(?:\s+of)?)\s*(?:is\s*)?(?:rs\.?\s*|inr\s*|₹\s*)?([\d,]+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|lakh|l|k|thousand)?\b/i,
  );
  const bedroom = message.match(/\b([1-9])\s*(?:bhk|bedrooms?|beds?)\b/i);
  const location = message
    .match(
      /\b(?:in|near|around|at)\s+(.+?)(?=\s+(?:under|below|up to|with|for|budget|\d\s*bhk)\b|[?.!]|$)/i,
    )?.[1]
    ?.trim();
  const reset = /\b(new search|start over|reset filters)\b/i.test(message);
  const refinement =
    budget ||
    bedroom ||
    location ||
    /\b(rent|buy|no budget|any budget|any location|any bhk)\b/i.test(
      message,
    );
  if (!category && !reset && !(previous.category && refinement)) return null;
  const result: BellaSearch = reset ? {} : { ...previous };
  if (category) {
    if (previous.category && category !== previous.category) {
      delete result.bedrooms;
      delete result.maxPrice;
      delete result.transaction;
    }
    result.category = category;
  }
  if (location) result.location = location;
  if (bedroom) result.bedrooms = Number(bedroom[1]);
  if (budget) {
    const unit = (budget[2] || "").toLowerCase();
    const multiplier = /^(crore|cr)/.test(unit)
      ? 10000000
      : /^(lakh|lac|l$)/.test(unit)
        ? 100000
        : /^(k|thousand)/.test(unit)
          ? 1000
          : 1;
    const value = Number(budget[1].replaceAll(",", "")) * multiplier;
    if (Number.isFinite(value) && value > 0) result.maxPrice = value;
  }
  if (/\brent\b/i.test(message)) result.transaction = "rent";
  if (/\b(buy|sale)\b/i.test(message)) result.transaction = "buy";
  if (/\b(no|any) budget\b/i.test(message)) delete result.maxPrice;
  if (/\bany location\b/i.test(message)) delete result.location;
  if (/\bany bhk\b/i.test(message)) delete result.bedrooms;
  return result;
}

export function matchesBellaSearch(listing: Listing, filters: BellaSearch) {
  const details =
    listing.details &&
    typeof listing.details === "object" &&
    !Array.isArray(listing.details)
      ? listing.details
      : {};
  if (filters.category && listing.category !== filters.category) return false;
  if (
    filters.maxPrice &&
    (!Number.isFinite(Number(listing.price)) ||
      Number(listing.price) <= 0 ||
      Number(listing.price) > filters.maxPrice)
  )
    return false;
  // Sellers post sale listings as either buy or sell; both are purchase options.
  if (filters.transaction === "rent" && listing.transaction_type !== "rent")
    return false;
  if (filters.transaction === "buy" && listing.transaction_type === "rent")
    return false;
  if (
    filters.location &&
    !`${listing.title || ""} ${listing.address || ""}`
      .toLowerCase()
      .includes(filters.location.toLowerCase())
  )
    return false;
  if (filters.bedrooms) {
    const bedrooms =
      Number(details.bedrooms) ||
      Number(listing.title?.match(/\b(\d+)\s*bhk\b/i)?.[1]);
    if (bedrooms !== filters.bedrooms) return false;
  }
  return true;
}

export function bellaSearchUrl(filters: BellaSearch) {
  const params = new URLSearchParams();
  if (filters.location) params.set("q", filters.location);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.transaction) params.set("txn", filters.transaction);
  const query = params.toString();
  return `${categoryPaths[filters.category || "house"]}${query ? `?${query}` : ""}`;
}

export function formatBellaPrice(price: number | undefined) {
  return Number.isFinite(Number(price)) && Number(price) > 0
    ? `₹${Number(price).toLocaleString("en-IN")}`
    : "Contact for price";
}
