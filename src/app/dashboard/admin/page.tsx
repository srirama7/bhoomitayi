"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import type { Profile, Listing } from "@/lib/types/database";
import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeListings: 0,
    pendingApprovals: 0,
  });
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "profiles"));
        const listingsSnap = await getDocs(collection(db, "listings"));
        const allListings = listingsSnap.docs.map(d => d.data() as Listing);
        
        setStats({
          totalUsers: usersSnap.size,
          totalListings: listingsSnap.size,
          activeListings: allListings.filter(l => l.status === "active").length,
          pendingApprovals: allListings.filter(l => l.status === "pending_payment").length,
        });

        const usersQuery = query(collection(db, "profiles"), orderBy("created_at", "desc"), limit(5));
        const recentUsersSnap = await getDocs(usersQuery);
        setRecentUsers(recentUsersSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Profile));

        const listingsQuery = query(collection(db, "listings"), orderBy("created_at", "desc"), limit(5));
        const recentListingsSnap = await getDocs(listingsQuery);
        setRecentListings(recentListingsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Listing));
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Analytics Overview</h1>
        <p className="text-zinc-500 text-sm mt-1">Real-time statistics and platform health metrics.</p>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Customers" value={stats.totalUsers} icon={Users} trend="+4.75%" />
        <MetricCard title="Marketplace Items" value={stats.totalListings} icon={Building} trend="+2.3%" />
        <MetricCard title="Live Sessions" value={stats.activeListings} icon={CheckCircle} trend="+1.2%" />
        <MetricCard title="Unresolved" value={stats.pendingApprovals} icon={Clock} trend="-0.5%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Registrations Table */}
        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent Onboarding</h3>
              <Link href="/dashboard/admin/users" className="text-xs font-medium text-blue-600 hover:underline">View all</Link>
           </div>
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                 <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                       <th className="px-6 py-3 font-medium text-zinc-500 text-[11px] uppercase tracking-wider">Name</th>
                       <th className="px-6 py-3 font-medium text-zinc-500 text-[11px] uppercase tracking-wider">Email</th>
                       <th className="px-6 py-3 font-medium text-zinc-500 text-[11px] uppercase tracking-wider text-right">Date</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {recentUsers.map(u => (
                       <tr key={u.id}>
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{u.full_name}</td>
                          <td className="px-6 py-4 text-zinc-500">{u.email}</td>
                          <td className="px-6 py-4 text-right text-zinc-400 font-mono text-[11px]">
                             {new Date(u.created_at).toLocaleDateString()}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
           <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent Items</h3>
           <div className="space-y-3">
              {recentListings.map(l => (
                 <div key={l.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                    <div className="min-w-0">
                       <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{l.title}</p>
                       <p className="text-[11px] text-zinc-500">{formatPrice(l.price)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase">{l.category}</Badge>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="size-10 rounded-md bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
          <Icon className="size-5 text-zinc-600 dark:text-zinc-400" />
        </div>
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", 
          trend.startsWith('+') ? "text-green-600 bg-green-50 border-green-100" : "text-red-600 bg-red-50 border-red-100"
        )}>
          {trend}
        </span>
      </div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{value.toLocaleString()}</h2>
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={cn("bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-md", className)} />;
}
