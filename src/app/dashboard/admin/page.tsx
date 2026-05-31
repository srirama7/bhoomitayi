"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building,
  Shield,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import type { Profile, Listing } from "@/lib/types/database";
import { formatPrice } from "@/lib/constants";

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
        // Fetch stats
        const usersSnap = await getDocs(collection(db, "profiles"));
        const listingsSnap = await getDocs(collection(db, "listings"));
        
        const allListings = listingsSnap.docs.map(d => d.data() as Listing);
        
        setStats({
          totalUsers: usersSnap.size,
          totalListings: listingsSnap.size,
          activeListings: allListings.filter(l => l.status === "active").length,
          pendingApprovals: allListings.filter(l => l.status === "pending_payment").length,
        });

        // Fetch recent users
        const usersQuery = query(collection(db, "profiles"), orderBy("created_at", "desc"), limit(5));
        const recentUsersSnap = await getDocs(usersQuery);
        setRecentUsers(recentUsersSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Profile));

        // Fetch recent listings
        const listingsQuery = query(collection(db, "listings"), orderBy("created_at", "desc"), limit(5));
        const recentListingsSnap = await getDocs(listingsQuery);
        setRecentListings(recentListingsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Listing));

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="h-32 bg-white dark:bg-zinc-900 animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">System Overview</h1>
        <p className="text-zinc-500 font-medium">Real-time platform performance and management metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          trend="+12%" 
          color="blue"
        />
        <StatsCard 
          title="Total Listings" 
          value={stats.totalListings} 
          icon={Building} 
          trend="+8%" 
          color="indigo"
        />
        <StatsCard 
          title="Active Items" 
          value={stats.activeListings} 
          icon={CheckCircle} 
          trend="+24%" 
          color="green"
        />
        <StatsCard 
          title="Pending" 
          value={stats.pendingApprovals} 
          icon={Clock} 
          trend="High" 
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-500">Recent Registrations</CardTitle>
            <Badge variant="outline" className="text-[10px] font-bold">Newest First</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 text-xs">
                      {u.full_name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{u.full_name}</p>
                      <p className="text-[10px] text-zinc-500">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Listings */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-500">Recent Marketplace Activity</CardTitle>
            <Badge variant="outline" className="text-[10px] font-bold">Active Flow</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentListings.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{l.title}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{l.category} • {formatPrice(l.price)}</p>
                  </div>
                  <Badge className={cn(
                    "text-[9px] px-1.5 h-4 capitalize border-none",
                    l.status === 'active' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {l.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    green: "bg-green-50 text-green-600 border-green-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={cn("p-2.5 rounded-xl border", colorMap[color])}>
            <Icon className="size-5" />
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">
            <TrendingUp className="size-3" />
            {trend}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{title}</p>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{value.toLocaleString()}</h2>
        </div>
      </CardContent>
    </Card>
  );
}
