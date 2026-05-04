export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  category: "house" | "land" | "pg" | "commercial" | "vehicle" | "commodity";
  transaction_type: "buy" | "sell" | "rent";
  title: string;
  description: string;
  price: number;
  address: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  owner_email?: string | null;
  status: "pending" | "active" | "rejected" | "sold" | "archived" | "timed_out";
  details: Json;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  listing_id: string;
  sender_id: string;
  message: string;
  phone: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
}

export type ListingCategory = Listing["category"];
export type TransactionType = Listing["transaction_type"];
export type ListingStatus = Listing["status"];

export interface HouseDetails {
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing: "furnished" | "semi" | "unfurnished";
  floors?: number;
  parking?: boolean;
  year_built?: number;
  amenities?: string[];
}

export interface LandDetails {
  area_sqft: number;
  land_type: "residential" | "commercial" | "agricultural" | "industrial";
  facing?: "north" | "south" | "east" | "west";
  road_width_ft?: number;
  boundary_wall?: boolean;
  is_corner_plot?: boolean;
  legal_clearance?: boolean;
}

export interface PGDetails {
  rent_per_month: number;
  security_deposit: number;
  gender_preference: "male" | "female" | "any";
  occupancy_type: "single" | "double" | "triple" | "any";
  meals_included: boolean;
  meal_types?: string[];
  wifi?: boolean;
  laundry?: boolean;
  ac?: boolean;
  attached_bathroom?: boolean;
  rules?: string;
  available_from: string;
  amenities?: string[];
}

export interface CommercialDetails {
  commercial_type: "office" | "shop" | "warehouse" | "showroom" | "coworking";
  area_sqft: number;
  furnishing: "furnished" | "semi" | "unfurnished";
  floors?: number;
  parking?: boolean;
  power_backup?: boolean;
  lift?: boolean;
}

export interface VehicleDetails {
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  fuel_type?: string;
  transmission?: string;
  km_driven?: number;
  owner_number?: number;
  registration_state?: string;
  insurance_valid?: boolean;
}

export interface CommodityDetails {
  commodity_type: string;
  brand?: string;
  condition: string;
  warranty?: boolean;
  age_months?: number;
}
