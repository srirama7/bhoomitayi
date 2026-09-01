"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Copy,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Rocket,
  Pin,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/config";
import {
  collection,
  orderBy,
  query,
  onSnapshot,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import type { BoosterRequest } from "@/lib/types/database";
import {
  approveBoosterRequest,
  rejectBoosterRequest,
} from "@/lib/tokens";

export default function AdminBoostersPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const [requests, setRequests] = useState<(BoosterRequest & { _colSource?: "booster_requests" | "token_requests" })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Real-time updates for booster_requests and booster token_requests
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    if (!db) {
      setLoading(false);
      return;
    }

    // Subscribe to booster_requests collection
    const qBoosters = query(
      collection(db, "booster_requests"),
      orderBy("created_at", "desc")
    );

    // Subscribe to token_requests collection for legacy booster entries
    const qTokens = query(
      collection(db, "token_requests"),
      orderBy("created_at", "desc")
    );

    let boostersData: (BoosterRequest & { _colSource?: "booster_requests" | "token_requests" })[] = [];
    let tokenBoostersData: (BoosterRequest & { _colSource?: "booster_requests" | "token_requests" })[] = [];

    const unsubBoosters = onSnapshot(
      qBoosters,
      (snapshot) => {
        boostersData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          _colSource: "booster_requests" as const,
        })) as any;
        combineAndSet();
      },
      (err) => {
        console.warn("Booster requests snapshot note:", err);
        combineAndSet();
      }
    );

    const unsubTokens = onSnapshot(
      qTokens,
      (snapshot) => {
        tokenBoostersData = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            _colSource: "token_requests" as const,
          }))
          .filter(
            (r: any) =>
              r.is_booster ||
              r.notes?.includes("BOOSTER PLAN") ||
              r.notes?.includes("PIN REQUEST")
          ) as any;
        combineAndSet();
      },
      (err) => {
        console.warn("Token booster snapshot note:", err);
        combineAndSet();
      }
    );

    function combineAndSet() {
      // Merge unique by id
      const map = new Map<string, BoosterRequest & { _colSource?: "booster_requests" | "token_requests" }>();
      boostersData.forEach((item) => map.set(item.id, item));
      tokenBoostersData.forEach((item) => {
        if (!map.has(item.id)) map.set(item.id, item);
      });
      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRequests(combined);
      setLoading(false);
    }

    return () => {
      unsubBoosters();
      unsubTokens();
    };
  }, [user, profile, authLoading]);

  // Handle Approve
  const handleApprove = async (req: BoosterRequest & { _colSource?: "booster_requests" | "token_requests" }) => {
    setActionLoadingId(req.id);
    try {
      const res = await approveBoosterRequest(
        req.id,
        req._colSource || "booster_requests",
        req.listing_id,
        req.plan_days
      );
      if (res.success) {
        toast.success(`Approved! Booster activated for ${req.user_name || req.user_email || "Seller"}.`);
      } else {
        toast.error(res.error || "Failed to approve booster request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error approving booster request");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject
  const handleReject = async (req: BoosterRequest & { _colSource?: "booster_requests" | "token_requests" }) => {
    setActionLoadingId(req.id);
    try {
      const res = await rejectBoosterRequest(req.id, req._colSource || "booster_requests");
      if (res.success) {
        toast.success(`Booster request marked as rejected.`);
      } else {
        toast.error(res.error || "Failed to reject request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error rejecting booster request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Calculations
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const totalRevenue = approvedRequests.reduce((sum, r) => sum + (r.amount || 0), 0);

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const qLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      r.user_name?.toLowerCase().includes(qLower) ||
      r.user_email?.toLowerCase().includes(qLower) ||
      r.transaction_id?.toLowerCase().includes(qLower) ||
      r.plan_name?.toLowerCase().includes(qLower) ||
      r.notes?.toLowerCase().includes(qLower) ||
      r.id.toLowerCase().includes(qLower);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center p-2 shadow-sm border border-blue-200 dark:border-blue-800">
            <Rocket className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Listing Booster & Pin Requests
            </h1>
            <p className="text-sm text-zinc-500">
              Verify listing visibility packages (Basic, Standard, Plus, Pro) and Pin placement payments.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Pending Verifications</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {pendingRequests.length}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Awaiting payment check</p>
            </div>
            <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/50">
              <Clock className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Approved Boosters</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {approvedRequests.length}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Verified & active</p>
            </div>
            <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Booster Revenue</p>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">From booster & pin sales</p>
            </div>
            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/50">
              <TrendingUp className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Total Requests</p>
              <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {requests.length}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">All time submissions</p>
            </div>
            <div className="size-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-900/50">
              <Zap className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            placeholder="Search by seller, plan, UTR, or listing details..."
            className="pl-9 h-10 border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["all", "pending", "approved", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                statusFilter === st
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {st === "all" ? "All Requests" : st}
              {st === "pending" && pendingRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Seller</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Booster / Pin Plan</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Amount</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Transaction / UTR & Notes</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Date & Time</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <Rocket className="size-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                    <p className="font-semibold text-sm">No booster requests found.</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {statusFilter !== "all" ? `No ${statusFilter} booster requests.` : "Sellers will appear here when they purchase booster plans for their listings."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isPending = req.status === "pending";
                  const isApproved = req.status === "approved";
                  const isRejected = req.status === "rejected";
                  const isActionLoading = actionLoadingId === req.id;

                  // Extract listing ID from notes or field
                  let listingId = req.listing_id;
                  if (!listingId && req.notes) {
                    const match = req.notes.match(/Listing ID:\s*([A-Za-z0-9_-]+)/i);
                    if (match) listingId = match[1];
                  }

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Seller Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{req.user_name || "Seller"}</span>
                          <span className="text-xs text-muted-foreground">{req.user_email || "No email"}</span>
                          {req.user_phone && (
                            <span className="text-[11px] font-mono text-zinc-400">{req.user_phone}</span>
                          )}
                        </div>
                      </td>

                      {/* Booster Plan */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs">
                            🚀
                          </div>
                          <div>
                            <span className="font-black text-foreground text-sm block">
                              {req.plan_name || (req.notes?.includes("PIN") ? "Pin Placement (30D)" : "Booster Plan")}
                            </span>
                            {req.plan_days && (
                              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                                {req.plan_days} Days Active
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-foreground text-sm">
                          ₹{req.amount}
                        </span>
                      </td>

                      {/* UTR / Notes & Listing Link */}
                      <td className="px-6 py-4">
                        {req.notes && (
                          <div className="text-xs font-medium text-foreground mb-1 max-w-xs truncate" title={req.notes}>
                            {req.notes}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {req.transaction_id && (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 select-all">
                                {req.transaction_id}
                              </span>
                              <button
                                onClick={() => copyToClipboard(req.transaction_id || "", "Transaction ID")}
                                className="text-zinc-400 hover:text-foreground p-1"
                                title="Copy UTR"
                              >
                                <Copy className="size-3.5" />
                              </button>
                            </div>
                          )}
                          {listingId && (
                            <Link
                              href={`/listing/${listingId}`}
                              target="_blank"
                              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md"
                            >
                              <span>View Listing</span>
                              <ExternalLink className="size-3" />
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isPending && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold text-[10px] gap-1">
                            <Clock className="size-3" /> Pending
                          </Badge>
                        )}
                        {isApproved && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold text-[10px] gap-1">
                            <CheckCircle2 className="size-3" /> Approved
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="destructive" className="font-bold text-[10px] gap-1">
                            <XCircle className="size-3" /> Rejected
                          </Badge>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm gap-1"
                              onClick={() => handleApprove(req)}
                              disabled={isActionLoading}
                            >
                              <CheckCircle2 className="size-3.5" />
                              {isActionLoading ? "..." : "Approve Booster"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs"
                              onClick={() => handleReject(req)}
                              disabled={isActionLoading}
                            >
                              <XCircle className="size-3.5" />
                              Reject
                            </Button>
                          </div>
                        ) : isApproved ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Booster Active
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-zinc-400">
                            Declined
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
