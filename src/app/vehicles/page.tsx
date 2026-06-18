"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListingGrid } from "@/components/listings/listing-grid";
import { Filters } from "@/components/listings/filters";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Car } from "lucide-react";
import { getListings } from "@/lib/queries";
import type { Listing } from "@/lib/types/database";

function VehiclesContent() {
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") as "buy" | "sell" | undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sort = searchParams.get("sort") || undefined;
  const searchQuery = searchParams.get("q") || undefined;
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

  const [listings, setListings] = useState<Listing[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getListings({
      category: "vehicle",
      transactionType: txn || undefined,
      minPrice,
      maxPrice,
      sort,
      page,
      search: searchQuery,
    }).then(({ data, count }) => {
      setListings(data);
      setCount(count);
    }).catch(() => {
      setListings([]);
      setCount(0);
    }).finally(() => {
      setLoading(false);
    });
  }, [txn, page, sort, minPrice, maxPrice, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/50 via-white to-rose-50/50 dark:from-zinc-950 dark:via-zinc-900/90 dark:to-zinc-950 relative overflow-hidden">
      {/* Decorative bright mesh background */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-red-400/20 dark:bg-red-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-rose-400/20 dark:bg-rose-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay pointer-events-none" />

      <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-900/80 dark:to-rose-900/80 shadow-2xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-red-300/40 blur-3xl mix-blend-overlay" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-rose-300/40 blur-3xl mix-blend-overlay" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl mb-6">
            <Car className="size-8 text-white drop-shadow-md" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-md mb-4">Vehicles</h1>
          <p className="text-red-50 text-xl max-w-2xl font-medium">
            Buy and sell cars, bikes, scooters, trucks, and more.
          </p>
        </div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <Tabs defaultValue={txn || "all"} className="mb-6">
          <TabsList className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-xl p-1 shadow-sm">
            <TabsTrigger value="all" asChild className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Link href="/vehicles">All</Link>
            </TabsTrigger>
            <TabsTrigger value="buy" asChild className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Link href="/vehicles?txn=buy">Buy</Link>
            </TabsTrigger>
            <TabsTrigger value="sell" asChild className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Link href="/vehicles?txn=sell">Sell</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 shrink-0">
            <div className="sticky top-24 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-xl">
              <Filters category="vehicle" />
            </div>
          </div>
          {loading ? (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[380px] rounded-2xl bg-white/40 dark:bg-zinc-800/40 backdrop-blur-sm" />
              ))}
            </div>
          ) : (
            <div className="flex-1">
              <ListingGrid listings={listings} totalCount={count} currentPage={page} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VehiclesContent />
    </Suspense>
  );
}
