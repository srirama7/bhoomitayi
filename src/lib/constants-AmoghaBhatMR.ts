export const CATEGORIES = [
  { value: "house" as const, label: "Houses", icon: "Home", emoji: "\u{1F3E1}", href: "/houses" },
  { value: "land" as const, label: "Land", icon: "Mountain", emoji: "\u{1F30D}", href: "/land" },
  { value: "pg" as const, label: "PG", icon: "Bed", emoji: "\u{1F6CF}\u{FE0F}", href: "/pg" },
  { value: "commercial" as const, label: "Commercial", icon: "Building2", emoji: "\u{1F3E2}", href: "/commercial" },
] as const;

export const TRANSACTION_TYPES = {
  house: ["buy", "sell", "rent"] as const,
  land: ["buy", "sell"] as const,
  pg: ["rent"] as const,
  commercial: ["buy", "sell", "rent"] as const,
};

export const FURNISHING_OPTIONS = [
  { value: "furnished", label: "Furnished" },
  { value: "semi", label: "Semi-Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

export const LAND_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "industrial", label: "Industrial" },
];

export const FACING_OPTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
];

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "any", label: "Any" },
];

export const OCCUPANCY_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "triple", label: "Triple" },
  { value: "any", label: "Any" },
];

export const COMMERCIAL_TYPES = [
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "warehouse", label: "Warehouse" },
  { value: "showroom", label: "Showroom" },
  { value: "coworking", label: "Co-working" },
];

export const ITEMS_PER_PAGE = 20;

export const MAX_IMAGES = 10;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `\u20B9${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `\u20B9${(price / 100000).toFixed(2)} L`;
  }
  if (price >= 1000) {
    return `\u20B9${(price / 1000).toFixed(1)}K`;
  }
  return `\u20B9${price.toLocaleString("en-IN")}`;
}

export function formatArea(sqft: number): string {
  return `${sqft.toLocaleString("en-IN")} sq.ft`;
}
