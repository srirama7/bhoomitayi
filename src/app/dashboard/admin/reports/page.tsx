"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Search, ExternalLink, Calendar, ShieldAlert, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import type { Profile, Listing, Report } from "@/lib/types/database";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EnrichedReport extends Report {
  reporterProfile?: Profile;
  listingDetails?: Listing;
}

export default function AdminReportsPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const repSnap = await getDocs(query(collection(db, "reports"), orderBy("created_at", "desc")));
      const rawReports = repSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Report);

      const profSnap = await getDocs(collection(db, "profiles"));
      const profilesMap = new Map<string, Profile>();
      profSnap.docs.forEach(d => profilesMap.set(d.id, { id: d.id, ...d.data() } as Profile));

      const listSnap = await getDocs(collection(db, "listings"));
      const listingsMap = new Map<string, Listing>();
      listSnap.docs.forEach(d => listingsMap.set(d.id, { id: d.id, ...d.data() } as Listing));

      const enriched = rawReports.map(r => ({
        ...r,
        reporterProfile: profilesMap.get(r.reporter_id),
        listingDetails: listingsMap.get(r.listing_id)
      }));

      setReports(enriched);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, profile, authLoading]);

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to dismiss and delete this report?")) return;
    try {
      await deleteDoc(doc(db, "reports", reportId));
      toast.success("Report dismissed");
      setReports(reports.filter(r => r.id !== reportId));
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  const filtered = reports.filter(r => 
    r.reporterProfile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.listingDetails?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  if (!user || profile?.role !== "admin") return <div>Access Denied</div>;

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-10">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <ShieldAlert className="size-8 text-amber-500" />
            Moderation Reports
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Review and manage community reports on listings.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search reports by reason, user, or listing..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            />
          </div>
          <div className="text-sm text-zinc-500 font-medium">
            {filtered.length} Reports Pending
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500 text-[11px] uppercase tracking-wider">Reporter</th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-[11px] uppercase tracking-wider">Reported Listing</th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-[11px] uppercase tracking-wider">Reason provided</th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-[11px] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((rep) => (
                <tr key={rep.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                        {rep.reporterProfile?.full_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{rep.reporterProfile?.full_name || "Unknown User"}</div>
                        <div className="text-xs text-zinc-500">{new Date(rep.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    {rep.listingDetails ? (
                      <div className="space-y-1">
                        <Link href={`/dashboard/admin/listings/${rep.listing_id}`} className="group flex items-center gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors line-clamp-2 max-w-[250px]">
                            {rep.listingDetails.title}
                          </span>
                          <ExternalLink className="size-3 text-zinc-400 group-hover:text-blue-600 shrink-0" />
                        </Link>
                        <Badge variant="outline" className={cn(
                          "capitalize",
                          rep.listingDetails.status === "active" ? "border-green-200 text-green-700 bg-green-50" : "bg-zinc-100"
                        )}>
                          Status: {rep.listingDetails.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-zinc-500 italic">Listing has been deleted</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <p className="text-zinc-700 dark:text-zinc-300 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md border border-amber-100 dark:border-amber-900/30 max-w-md">
                      {rep.reason}
                    </p>
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleDeleteReport(rep.id)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Dismiss
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No moderation reports found.
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
