"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FURNISHING_OPTIONS,
  LAND_TYPES,
  FACING_OPTIONS,
  GENDER_OPTIONS,
  OCCUPANCY_OPTIONS,
  COMMERCIAL_TYPES,
  VEHICLE_TYPES,
  FUEL_TYPES,
  COMMODITY_TYPES,
  CONDITION_OPTIONS,
} from "@/lib/constants";
import type { ListingCategory } from "@/lib/types/database";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface FiltersProps {
  category: ListingCategory;
}

export function Filters({ category }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minArea, setMinArea] = useState(searchParams.get("minArea") || "");
  const [maxArea, setMaxArea] = useState(searchParams.get("maxArea") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [furnishing, setFurnishing] = useState(searchParams.get("furnishing") || "");
  const [landType, setLandType] = useState(searchParams.get("landType") || "");
  const [facing, setFacing] = useState(searchParams.get("facing") || "");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [occupancy, setOccupancy] = useState(searchParams.get("occupancy") || "");
  const [commercialType, setCommercialType] = useState(searchParams.get("commercialType") || "");
  const [vehicleType, setVehicleType] = useState(searchParams.get("vehicleType") || "");
  const [fuelType, setFuelType] = useState(searchParams.get("fuelType") || "");
  const [commodityType, setCommodityType] = useState(searchParams.get("commodityType") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key: string, val: string) => {
      if (val) params.set(key, val);
      else params.delete(key);
    };

    setOrDelete("minPrice", minPrice);
    setOrDelete("maxPrice", maxPrice);
    setOrDelete("minArea", minArea);
    setOrDelete("maxArea", maxArea);
    setOrDelete("bedrooms", bedrooms);
    setOrDelete("furnishing", furnishing);
    setOrDelete("landType", landType);
    setOrDelete("facing", facing);
    setOrDelete("gender", gender);
    setOrDelete("occupancy", occupancy);
    setOrDelete("commercialType", commercialType);
    setOrDelete("vehicleType", vehicleType);
    setOrDelete("fuelType", fuelType);
    setOrDelete("commodityType", commodityType);
    setOrDelete("condition", condition);
    params.delete("page");

    router.push(`?${params.toString()}`);
    setOpen(false);
  }, [router, searchParams, minPrice, maxPrice, minArea, maxArea, bedrooms, furnishing, landType, facing, gender, occupancy, commercialType, vehicleType, fuelType, commodityType, condition]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    const txn = searchParams.get("txn");
    if (txn) params.set("txn", txn);
    router.push(`?${params.toString()}`);
    setMinPrice(""); setMaxPrice("");
    setMinArea(""); setMaxArea(""); setBedrooms(""); setFurnishing("");
    setLandType(""); setFacing(""); setGender(""); setOccupancy("");
    setCommercialType("");
    setVehicleType(""); setFuelType("");
    setCommodityType(""); setCondition("");
    setOpen(false);
  }, [router, searchParams]);

  const filterContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Min Price</Label>
          <Input type="number" placeholder="₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        </div>
        <div>
          <Label>Max Price</Label>
          <Input type="number" placeholder="₹" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>

      {(category === "house" || category === "land" || category === "commercial") && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Min Area (sq.ft)</Label>
            <Input type="number" value={minArea} onChange={(e) => setMinArea(e.target.value)} />
          </div>
          <div>
            <Label>Max Area (sq.ft)</Label>
            <Input type="number" value={maxArea} onChange={(e) => setMaxArea(e.target.value)} />
          </div>
        </div>
      )}

      {category === "house" && (
        <>
          <div>
            <Label>Bedrooms (min)</Label>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}+</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Furnishing</Label>
            <Select value={furnishing} onValueChange={setFurnishing}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {FURNISHING_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {category === "land" && (
        <>
          <div>
            <Label>Land Type</Label>
            <Select value={landType} onValueChange={setLandType}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {LAND_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Facing</Label>
            <Select value={facing} onValueChange={setFacing}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {FACING_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {category === "pg" && (
        <>
          <div>
            <Label>Gender Preference</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Occupancy Type</Label>
            <Select value={occupancy} onValueChange={setOccupancy}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {OCCUPANCY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {category === "commercial" && (
        <>
          <div>
            <Label>Commercial Type</Label>
            <Select value={commercialType} onValueChange={setCommercialType}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {COMMERCIAL_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Furnishing</Label>
            <Select value={furnishing} onValueChange={setFurnishing}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {FURNISHING_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {category === "vehicle" && (
        <>
          <div>
            <Label>Vehicle Type</Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fuel Type</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {FUEL_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {category === "commodity" && (
        <>
          <div>
            <Label>Commodity Type</Label>
            <Select value={commodityType} onValueChange={setCommodityType}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {COMMODITY_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={applyFilters} className="flex-1">Apply Filters</Button>
        <Button variant="outline" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 bg-white dark:bg-zinc-900/80 shadow-3d">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
            <SlidersHorizontal className="h-4 w-4 text-blue-500" /> Filters
          </h3>
          {filterContent}
        </div>
      </aside>

      {/* Mobile filter sheet */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
