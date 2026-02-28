"use client";

import { useEffect, useState } from "react";
import { List, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalInquiries: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    pendingListings: 0,
    totalInquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch all listings for this user
        const listingsRef = collection(db, "listings");
        const userListingsQuery = query(
          listingsRef,
          where("user_id", "==", user.uid)
        );
        const listingsSnap = await getDocs(userListingsQuery);

        let totalListings = 0;
        let activeListings = 0;
        let pendingListings = 0;
        const listingIds: string[] = [];

        listingsSnap.forEach((doc) => {
          totalListings++;
          const data = doc.data();
          if (data.status === "active") activeListings++;
          if (data.status === "pending") pendingListings++;
          listingIds.push(doc.id);
        });

        // Fetch inquiry count for user's listings
        let inquiryCount = 0;
        if (listingIds.length > 0) {
          // Firestore 'in' queries support max 30 items per query
          const chunks: string[][] = [];
          for (let i = 0; i < listingIds.length; i += 30) {
            chunks.push(listingIds.slice(i, i + 30));
          }
          for (const chunk of chunks) {
            const inquiriesQuery = query(
              collection(db, "inquiries"),
              where("listing_id", "in", chunk)
            );
            const inquiriesSnap = await getDocs(inquiriesQuery);
            inquiryCount += inquiriesSnap.size;
          }
        }

        setStats({
          totalListings,
          activeListings,
          pendingListings,
          totalInquiries: inquiryCount,
        });
      } catch {
        // Stats will show 0 values on error
      }
      setLoading(false);
    };

    fetchStats();
  }, [user, authLoading]);

  const statCards = [
    {
      title: "Total Listings",
      value: stats.totalListings,
      icon: List,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Active Listings",
      value: stats.activeListings,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Pending Listings",
      value: stats.pendingListings,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      title: "Total Inquiries",
      value: stats.totalInquiries,
      icon: MessageSquare,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      gradient: "from-violet-500 to-purple-600",
    },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80 overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
              <div className={`h-1 bg-gradient-to-r ${stat.gradient} opacity-60`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                  <Icon className={`size-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
