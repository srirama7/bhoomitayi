"use client";

import { useEffect, useState } from "react";
import { Heart, Search, ExternalLink, Calendar, Building, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import type { Profile, Listing, Favorite } from "@/lib/types/database";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EnrichedFavorite extends Favorite {
  userProfile?: Profile;
  listingDetails?: Listing;
}

export default function AdminFavoritesPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const [favorites, setFavorites] = useState<EnrichedFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const favSnap = await getDocs(query(collection(db, "favorites"), orderBy("created_at", "desc")));
        const rawFavorites = favSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Favorite);

        const profSnap = await getDocs(collection(db, "profiles"));
        const profilesMap = new Map<string, Profile>();
        profSnap.docs.forEach(d => profilesMap.set(d.id, { id: d.id, ...d.data() } as Profile));

        const listSnap = await getDocs(collection(db, "listings"));
        const listingsMap = new Map<string, Listing>();
        listSnap.docs.forEach(d => listingsMap.set(d.id, { id: d.id, ...d.data() } as Listing));

        const enriched = rawFavorites.map(f => ({
          ...f,
          userProfile: profilesMap.get(f.user_id),
          listingDetails: listingsMap.get(f.listing_id)
        }));

        setFavorites(enriched);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, profile, authLoading]);

  const filtered = favorites.filter(f => 
    f.userProfile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.listingDetails?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.userProfile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  if (!user || profile?.role !== "admin") return <div>Access Denied</div>;

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-10">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <Heart className="size-8 text-rose-500" />
            User Favorites
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Track and analyze properties saved by users.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search by user or listing title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            />
          </div>
          <div className="text-sm text-zinc-500 font-medium">
            {filtered.length} Favorites
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500 text-[11px] uppercase tracking-wider">User</th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-[11px] uppercase tracking-wider">Listing</th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-[11px] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-[11px] uppercase tracking-wider text-right">Saved On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((fav) => (
                <tr key={fav.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                        {fav.userProfile?.full_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{fav.userProfile?.full_name || "Unknown User"}</div>
                        <div className="text-xs text-zinc-500">{fav.userProfile?.email || "No email"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {fav.listingDetails ? (
                      <Link href={`/dashboard/admin/listings/${fav.listing_id}`} className="group flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors line-clamp-1 max-w-[250px]">
                          {fav.listingDetails.title}
                        </span>
                        <ExternalLink className="size-3 text-zinc-400 group-hover:text-blue-600" />
                      </Link>
                    ) : (
                      <span className="text-zinc-500 italic">Listing Deleted</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {fav.listingDetails && (
                      <Badge variant="outline" className="capitalize bg-zinc-50 dark:bg-zinc-800">
                        {fav.listingDetails.category}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap text-zinc-500 tabular-nums">
                    {new Date(fav.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No favorites found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
