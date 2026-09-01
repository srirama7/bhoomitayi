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
  email?: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  tokens?: number;
  unlocked_listings?: string[];
  created_at: string;
  updated_at: string;
}

export interface TokenRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string | null;
  user_phone?: string | null;
  tokens: number;
  amount: number;
  transaction_id?: string | null;
  payment_proof?: string | null;
  status: "pending" | "approved" | "rejected";
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_booster?: boolean;
}

export interface BoosterRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string | null;
  user_phone?: string | null;
  plan_name?: string | null;
  plan_days?: number | null;
  amount: number;
  transaction_id?: string | null;
  listing_id?: string | null;
  notes?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at?: string | null;
  is_booster?: boolean;
}

export interface Listing {
  id: string;
  user_id: string;
  category: "house" | "land" | "pg" | "commercial" | "vehicle" | "commodity";
  transaction_type: "buy" | "sell" | "rent";
  title: string;
  description: string;
  price?: number;
  address: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  status: "pending" | "pending_payment" | "active" | "rejected" | "sold" | "archived" | "timed_out";
  payment_status?: "pending" | "approved" | "not_required";
  payment_amount?: number;
  payment_reason?: "initial_listing" | "reactivation";
  last_payment_submitted_at?: string | null;
  reactivation_count?: number;
  expires_at?: string | null;
  timer_duration?: {
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
  details?: Json;
  created_at: string;
  updated_at: string;
  pinned?: boolean;
  pin_status?: "none" | "pending_approval" | "approved" | "rejected";
  pin_payment_status?: "pending" | "approved";
  pin_payment_amount?: number;
  pin_requested_at?: string;
  pin_expires_at?: string | null;
  favorites_count?: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
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

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number; // e.g. 50 (for 50%) or 20 (for ₹20 off)
  min_order_value?: number;
  max_discount_amount?: number;
  expires_at?: string | null;
  applicable_to: "all" | "tokens" | "listings";
  is_active: boolean;
  usage_count?: number;
  max_uses?: number | null;
  created_at: string;
  created_by?: string;
}
