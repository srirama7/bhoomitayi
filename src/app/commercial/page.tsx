"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListingGrid } from "@/components/listings/listing-grid";
import { Filters } from "@/components/listings/filters";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { getListings } from "@/lib/queries";
import type { Listing } from "@/lib/types/database";

function CommercialContent() {
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") as "buy" | "sell" | "rent" | undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sort = searchParams.get("sort") || undefined;
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

  const [listings, setListings] = useState<Listing[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getListings({
      category: "commercial",
      transactionType: txn || undefined,
      minPrice,
      maxPrice,
      sort,
      page,
    }).then(({ data, count }) => {
      setListings(data);
      setCount(count);
    }).catch(() => {
      setListings([]);
      setCount(0);
    }).finally(() => {
      setLoading(false);
    });
  }, [txn, page, sort, minPrice, maxPrice]);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-amber-50 via-orange-50/50 to-background dark:from-amber-950/30 dark:via-orange-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-200/30 dark:bg-amber-800/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-orange-200/30 dark:bg-orange-800/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Building2 className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Commercial Properties</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            Offices, shops, warehouses, showrooms & co-working spaces
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={txn || "all"} className="mb-6">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-1">
            <TabsTrigger value="all" asChild className="rounded-lg data-[state=active]:shadow-md">
              <Link href="/commercial">All</Link>
            </TabsTrigger>
            <TabsTrigger value="buy" asChild className="rounded-lg data-[state=active]:shadow-md">
              <Link href="/commercial?txn=buy">Buy</Link>
            </TabsTrigger>
            <TabsTrigger value="sell" asChild className="rounded-lg data-[state=active]:shadow-md">
              <Link href="/commercial?txn=sell">Sell</Link>
            </TabsTrigger>
            <TabsTrigger value="rent" asChild className="rounded-lg data-[state=active]:shadow-md">
              <Link href="/commercial?txn=rent">Rent</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-6">
          <Filters category="commercial" />
          {loading ? (
            <div className="flex-1">
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          ) : (
            <ListingGrid listings={listings} totalCount={count} currentPage={page} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommercialPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CommercialContent />
    </Suspense>
  );
}
