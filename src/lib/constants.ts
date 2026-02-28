export const CATEGORIES = [
  { value: "house" as const, label: "Houses", icon: "Home", emoji: "🏡", href: "/houses" },
  { value: "land" as const, label: "Land", icon: "Mountain", emoji: "🌍", href: "/land" },
  { value: "pg" as const, label: "PG", icon: "Bed", emoji: "🛏️", href: "/pg" },
  { value: "commercial" as const, label: "Commercial", icon: "Building2", emoji: "🏢", href: "/commercial" },
  { value: "vehicle" as const, label: "Vehicles", icon: "Car", emoji: "🚗", href: "/vehicles" },
  { value: "commodity" as const, label: "Other Commodities", icon: "Package", emoji: "📦", href: "/commodities" },
] as const;

export const TRANSACTION_TYPES = {
  house: ["buy", "sell", "rent"] as const,
  land: ["buy", "sell"] as const,
  pg: ["rent"] as const,
  commercial: ["buy", "sell", "rent"] as const,
  vehicle: ["buy", "sell"] as const,
  commodity: ["buy", "sell"] as const,
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

export const VEHICLE_TYPES = [
  { value: "car", label: "Car" },
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "truck", label: "Truck" },
  { value: "bus", label: "Bus" },
  { value: "auto", label: "Auto" },
  { value: "bicycle", label: "Bicycle" },
  { value: "ev", label: "Electric Vehicle" },
];

export const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "cng", label: "CNG" },
];

export const TRANSMISSION_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
];

export const COMMODITY_TYPES = [
  { value: "electronics", label: "Electronics" },
  { value: "furniture", label: "Furniture" },
  { value: "appliances", label: "Appliances" },
  { value: "clothing", label: "Clothing" },
  { value: "sports", label: "Sports" },
  { value: "books", label: "Books" },
  { value: "tools", label: "Tools" },
  { value: "other", label: "Other" },
];

export const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
];

export const ITEMS_PER_PAGE = 20;

export const MAX_IMAGES = 4;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  if (price >= 1000) {
    return `₹${(price / 1000).toFixed(1)}K`;
  }
  return `₹${price.toLocaleString("en-IN")}`;
}

export function formatArea(sqft: number): string {
  return `${sqft.toLocaleString("en-IN")} sq.ft`;
}
