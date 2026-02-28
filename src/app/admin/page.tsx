"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Flag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";

interface DashboardStats {
  totalListings: number;
  pendingReview: number;
  activeListings: number;
  rejectedListings: number;
  totalUsers: number;
  totalReports: number;
}

export default function AdminDashboardPage() {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    pendingReview: 0,
    activeListings: 0,
    rejectedListings: 0,
    totalUsers: 0,
    totalReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          totalListingsSnap,
          pendingSnap,
          activeSnap,
          rejectedSnap,
          usersSnap,
          reportsSnap,
        ] = await Promise.all([
          getDocs(collection(db, "listings")),
          getDocs(
            query(collection(db, "listings"), where("status", "==", "pending"))
          ),
          getDocs(
            query(collection(db, "listings"), where("status", "==", "active"))
          ),
          getDocs(
            query(collection(db, "listings"), where("status", "==", "rejected"))
          ),
          getDocs(collection(db, "profiles")),
          getDocs(collection(db, "reports")),
        ]);

        setStats({
          totalListings: totalListingsSnap.size,
          pendingReview: pendingSnap.size,
          activeListings: activeSnap.size,
          rejectedListings: rejectedSnap.size,
          totalUsers: usersSnap.size,
          totalReports: reportsSnap.size,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Listings",
      value: stats.totalListings,
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Pending Review",
      value: stats.pendingReview,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      badge: stats.pendingReview > 0 ? "Needs Attention" : undefined,
    },
    {
      title: "Active",
      value: stats.activeListings,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Rejected",
      value: stats.rejectedListings,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Reports",
      value: stats.totalReports,
      icon: Flag,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      badge: stats.totalReports > 0 ? "Review" : undefined,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {profile?.full_name}. Here is an overview of PropNest.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-8 w-16 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <Card key={card.title} className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`rounded-xl p-2.5 ${card.bg}`}>
                  <card.icon className={`size-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">{card.value}</span>
                  {card.badge && (
                    <Badge variant="destructive" className="text-xs">
                      {card.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
