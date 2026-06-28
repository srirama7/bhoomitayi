"use client";

import { useState, useEffect } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Search, X } from "lucide-react";
import type { Listing } from "@/lib/types/database";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { getRemainingTimeMs } from "@/lib/listing-timer";

interface ListingGridProps {
  listings: Listing[];
  totalCount: number;
  currentPage: number;
}

export function ListingGrid({ listings, totalCount, currentPage }: ListingGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const handlePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    // Auto-clear the search when input is emptied manually
    if (searchQuery.trim() === "" && searchParams.has("q")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      params.delete("page");
      router.push(`?${params.toString()}`);
    }
  }, [searchQuery, searchParams, router]);

  const handleClear = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      {/* Universal Prominent Search Bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties by title, location, or description..."
            className="pl-10 pr-10 h-12 text-base rounded-xl bg-white dark:bg-zinc-900/80 shadow-sm border-zinc-200 dark:border-zinc-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="h-12 px-6 rounded-xl font-medium">Search</Button>
      </form>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "service" : "services"} found
        </p>
        <div className="flex items-center gap-2">
          <Select defaultValue={searchParams.get("sort") || "newest"} onValueChange={handleSort}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price_asc">Price: Low-High</SelectItem>
              <SelectItem value="price_desc">Price: High-Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Listings */}
      {listings.filter((l) => getRemainingTimeMs(l.expires_at) !== 0).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">No properties found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {listings.filter((l) => getRemainingTimeMs(l.expires_at) !== 0).map((listing) => (
            <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePage(currentPage - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
