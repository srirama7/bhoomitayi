"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Copy,
  PlusCircle,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  orderBy,
  query,
  onSnapshot,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import type { TokenRequest, Profile } from "@/lib/types/database";
import {
  approveTokenPurchase,
  rejectTokenPurchase,
  adminGrantTokensByEmail,
  adminGrantUserTokens,
} from "@/lib/tokens";

export default function AdminTokensPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const [requests, setRequests] = useState<TokenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Manual Grant Form State
  const [manualEmail, setManualEmail] = useState("");
  const [manualTokens, setManualTokens] = useState<number>(3);
  const [grantingTokens, setGrantingTokens] = useState(false);

  // Load token requests with real-time updates
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

    const q = query(
      collection(db, "token_requests"),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reqs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as TokenRequest[];
        setRequests(reqs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching token requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, profile, authLoading]);

  // Handle Approve
  const handleApprove = async (req: TokenRequest) => {
    setActionLoadingId(req.id);
    try {
      const res = await approveTokenPurchase(req.id, req.user_id, req.tokens);
      if (res.success) {
        toast.success(`Approved! Credited ${req.tokens} tokens to ${req.user_name || req.user_email}.`);
      } else {
        toast.error(res.error || "Failed to approve request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error approving request");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject
  const handleReject = async (req: TokenRequest) => {
    setActionLoadingId(req.id);
    try {
      const res = await rejectTokenPurchase(req.id);
      if (res.success) {
        toast.success(`Request ${req.id.slice(0, 6)} marked as rejected.`);
      } else {
        toast.error(res.error || "Failed to reject request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error rejecting request");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Manual Grant by Email
  const handleManualGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) {
      toast.error("Please enter a user email address.");
      return;
    }

    if (manualTokens < 1) {
      toast.error("Please enter at least 1 token.");
      return;
    }

    setGrantingTokens(true);
    try {
      const res = await adminGrantTokensByEmail(manualEmail.trim(), Number(manualTokens));
      if (res.success) {
        toast.success(`Successfully granted ${manualTokens} BhoomiTayi Tokens to ${manualEmail.trim()}! New balance: ${res.user?.tokens} tokens.`);
        setManualEmail("");
        setManualTokens(3);
      } else {
        toast.error(res.error || "Failed to grant tokens.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error granting tokens");
    } finally {
      setGrantingTokens(false);
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
  const totalTokensIssued = approvedRequests.reduce((sum, r) => sum + (r.tokens || 0), 0);

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const qLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      r.user_name?.toLowerCase().includes(qLower) ||
      r.user_email?.toLowerCase().includes(qLower) ||
      r.transaction_id?.toLowerCase().includes(qLower) ||
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
          <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center p-2 shadow-sm border border-emerald-200 dark:border-emerald-800">
            <Image src="/token_icon.png" alt="Token" width={32} height={32} className="rounded-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              BhoomiTayi Token Management
            </h1>
            <p className="text-sm text-zinc-500">
              Verify QR code payments, approve token purchase requests, and grant tokens manually.
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
              <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Total Approved Requests</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {approvedRequests.length}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Verified & credited</p>
            </div>
            <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Revenue Collected</p>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">From token purchases</p>
            </div>
            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/50">
              <TrendingUp className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Tokens Credited</p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                🪙 {totalTokensIssued}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Total sold to buyers</p>
            </div>
            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-900/50">
              <Coins className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Grant Section */}
      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 dark:bg-zinc-900 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="size-5 text-emerald-600" />
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Manual Token Grant for Any Account / Gmail
              </CardTitle>
              <CardDescription className="text-xs">
                Directly add tokens to any customer email (e.g. if they paid via cash or offline UPI).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleManualGrant} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6 space-y-1.5">
              <Label htmlFor="manualEmail" className="text-xs font-bold">
                Customer Gmail / Account Email Address *
              </Label>
              <Input
                id="manualEmail"
                type="email"
                placeholder="customer@gmail.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="h-10 rounded-xl bg-white dark:bg-zinc-950"
                required
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <Label htmlFor="manualTokens" className="text-xs font-bold">
                Tokens to Grant *
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="manualTokens"
                  type="number"
                  min={1}
                  max={1000}
                  value={manualTokens}
                  onChange={(e) => setManualTokens(Number(e.target.value))}
                  className="h-10 rounded-xl bg-white dark:bg-zinc-950 font-bold"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Button
                type="submit"
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm"
                disabled={grantingTokens}
              >
                <Coins className="size-4" />
                {grantingTokens ? "Granting..." : "Grant Tokens Now"}
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400">Quick Token Presets:</span>
            {[1, 3, 7, 15, 32, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setManualTokens(num)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                  manualTokens === num
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                +{num} Tokens
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            placeholder="Search by name, email, UTR, or Request ID..."
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
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">User</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Tokens Plan</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Amount</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Transaction / UTR</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Date & Time</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[11px] tracking-wider text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <Coins className="size-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                    <p className="font-semibold text-sm">No token requests found.</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {statusFilter !== "all" ? `No ${statusFilter} requests.` : "Users will appear here when they submit token purchase requests."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isPending = req.status === "pending";
                  const isApproved = req.status === "approved";
                  const isRejected = req.status === "rejected";
                  const isActionLoading = actionLoadingId === req.id;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{req.user_name || "Customer"}</span>
                          <span className="text-xs text-muted-foreground">{req.user_email || "No email"}</span>
                          {req.user_phone && (
                            <span className="text-[11px] font-mono text-zinc-400">{req.user_phone}</span>
                          )}
                        </div>
                      </td>

                      {/* Tokens */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Image src="/token_icon.png" alt="Token" width={20} height={20} className="rounded-full" />
                          <span className="font-black text-foreground text-sm">
                            {req.tokens} Tokens
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-foreground text-sm">
                          ₹{req.amount}
                        </span>
                      </td>

                      {/* UTR / Transaction ID */}
                      {/* UTR / Transaction ID */}
                      <td className="px-6 py-4">
                        {req.notes && (
                          <div className="text-xs font-bold text-foreground mb-1">
                            Sender: {req.notes}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 select-all">
                            {req.transaction_id || "None provided"}
                          </span>
                          {req.transaction_id && (
                            <button
                              onClick={() => copyToClipboard(req.transaction_id || "", "Transaction ID")}
                              className="text-zinc-400 hover:text-foreground p-1"
                              title="Copy UTR"
                            >
                              <Copy className="size-3.5" />
                            </button>
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
                              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm gap-1"
                              onClick={() => handleApprove(req)}
                              disabled={isActionLoading}
                            >
                              <CheckCircle2 className="size-3.5" />
                              {isActionLoading ? "..." : "Approve & Credit"}
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
                            Tokens Credited
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
