"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { getListingUrl } from "@/lib/firebase/native-auth";
import Image from "next/image";

interface RecentListing {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
}

export function RecentlyViewed() {
  const [recent, setRecent] = useState<RecentListing[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bhoomitayi_recently_viewed");
      if (stored) {
        setRecent(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (recent.length === 0) return null;

  return (
    <div className="mt-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="size-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-foreground">Recently Viewed by You</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recent.map((item) => (
          <Link key={item.id} href={getListingUrl(item.id)} className="group block">
            <div className="bg-white dark:bg-zinc-900/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="relative h-32 w-full bg-zinc-100 dark:bg-zinc-800">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full capitalize">
                  {item.category}
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-foreground truncate text-sm">{item.title}</p>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-xs mt-1">{formatPrice(item.price)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
