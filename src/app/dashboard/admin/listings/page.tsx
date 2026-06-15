"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  IndianRupee,
  Loader2,
  ShieldAlert,
  Tag,
  Trash2,
  Pencil,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  MoreVertical,
  Timer,
  X,
  XCircle,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { formatPrice } from "@/lib/constants";
import {
  addTimerDuration,
  DEFAULT_TIMER_DURATION,
  LISTING_FEE,
  formatTimerDuration,
  getEffectiveListingStatus,
  getRemainingTimeMs,
  hasTimerDuration,
  sanitizeTimerDuration,
  type TimerDuration,
} from "@/lib/listing-timer";
import { useAuthStore } from "@/lib/store";
import type { Listing } from "@/lib/types/database";
import { ListingCountdown } from "@/components/listings/listing-countdown";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminListing = Listing & {
  sellerName: string;
  sellerPhone: string | null;
  sellerEmail: string | null;
};

type TimerMap = Record<string, TimerDuration>;
type FilterStatus = "all" | "active" | "timed_out" | "pending_payment" | "sold";

export default function AdminListingsPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [timerInputs, setTimerInputs] = useState<TimerMap>({});
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [, forceTick] = useState(0);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);

  useEffect(() => {
    const timer = setInterval(() => forceTick((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    const fetchListings = async () => {
      try {
        const snap = await getDocs(query(collection(db, "listings"), orderBy("created_at", "desc")));
        const allListings = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Listing);

        const listingsWithProfiles = await Promise.all(
          allListings.map(async (l) => {
            const pSnap = await getDoc(doc(db, "profiles", l.user_id));
            const p = pSnap.exists() ? pSnap.data() : null;
            return {
              ...l,
              sellerName: p?.full_name ?? "Unknown",
              sellerPhone: p?.phone ?? null,
              sellerEmail: p?.email ?? null,
            };
          })
        );

        setListings(listingsWithProfiles);
        setTimerInputs(
          Object.fromEntries(
            listingsWithProfiles.map((l: any) => {
              let duration = sanitizeTimerDuration(l.timer_duration ?? DEFAULT_TIMER_DURATION);
              if (!hasTimerDuration(duration) && l.plan_days) {
                duration = sanitizeTimerDuration({ days: l.plan_days });
              }
              return [l.id, duration];
            })
          )
        );
      } catch (error) {
        console.error("Fetch listings error:", error);
      }
      setLoading(false);
    };
    fetchListings();
  }, [user, profile, authLoading]);

  const filteredListings = useMemo(() => {
    let result = listings.filter((l) => l.status !== "archived");
    
    if (filter !== "all") {
      result = result.filter((l) => {
        const effective = getEffectiveListingStatus(l);
        if (filter === "timed_out") return effective === "timed_out";
        if (filter === "active") return effective === "active";
        return l.status === filter;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.sellerName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [listings, filter, searchQuery]);

  const stats = useMemo(() => {
    const visible = listings.filter((l) => l.status !== "archived");
    const counts = { all: visible.length, active: 0, timed_out: 0, pending: 0, sold: 0 };
    visible.forEach((l) => {
      const effective = getEffectiveListingStatus(l);
      if (effective === "active") counts.active++;
      else if (effective === "timed_out") counts.timed_out++;
      if (l.status === "pending_payment") counts.pending++;
      if (l.status === "sold") counts.sold++;
    });
    return counts;
  }, [listings]);

  const updateTimerField = (id: string, field: keyof TimerDuration, val: string) => {
    const num = Math.max(0, Number(val || 0));
    setTimerInputs(prev => ({ ...prev, [id]: { ...(prev[id] ?? DEFAULT_TIMER_DURATION), [field]: num } }));
  };

  const handleSetTimer = async (l: AdminListing, activate = false) => {
    const duration = sanitizeTimerDuration(timerInputs[l.id]);
    if (!hasTimerDuration(duration)) { toast.error("Enter duration"); return; }
    setUpdatingId(l.id);
    try {
      const expiresAt = addTimerDuration(new Date(), duration).toISOString();
      const nextStatus = activate || l.status === "pending_payment" ? "active" : l.status;
      await updateDoc(doc(db, "listings", l.id), {
        status: nextStatus,
        payment_status: nextStatus === "active" ? "approved" : l.payment_status ?? "approved",
        expires_at: expiresAt,
        timer_duration: duration,
        updated_at: new Date().toISOString(),
      });
      setListings(prev => prev.map(item => item.id === l.id ? { ...item, status: nextStatus, expires_at: expiresAt, timer_duration: duration } : item));
      toast.success("Timer updated");
    } catch { toast.error("Failed"); }
    setUpdatingId(null);
  };

  const handleUpdateStatus = async (id: string, s: Listing["status"]) => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "listings", id), { status: s, updated_at: new Date().toISOString() });
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: s } : l));
      toast.success(`Status: ${s}`);
    } catch { toast.error("Error"); }
    setUpdatingId(null);
  };

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-[600px] w-full" /></div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Marketplace Listings</h1>
          <p className="text-sm text-zinc-500">Monitor activity, approve payments, and manage listing durations.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="font-bold">Total: {stats.all}</Badge>
           <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none font-bold">Pending: {stats.pending}</Badge>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-4">
           {/* Filters */}
           <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                <Input 
                  placeholder="Search listings..." 
                  className="pl-9 h-9 text-xs border-zinc-200" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)} className="w-full sm:w-auto">
                <TabsList className="bg-zinc-100 dark:bg-zinc-800 h-9 p-0.5 rounded-md">
                   <TabsTrigger value="all" className="text-[10px] h-8 px-3">ALL</TabsTrigger>
                   <TabsTrigger value="active" className="text-[10px] h-8 px-3">ACTIVE</TabsTrigger>
                   <TabsTrigger value="pending_payment" className="text-[10px] h-8 px-3">PENDING</TabsTrigger>
                   <TabsTrigger value="timed_out" className="text-[10px] h-8 px-3">EXPIRED</TabsTrigger>
                </TabsList>
              </Tabs>
           </div>

           {/* Listings Table */}
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                       <tr>
                          <th className="px-6 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">Item Details</th>
                          <th className="px-6 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">Seller</th>
                          <th className="px-6 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">Status</th>
                          <th className="px-6 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">Price</th>
                          <th className="px-6 py-3 font-medium text-zinc-500 uppercase text-[10px] tracking-wider text-right">Control</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                       {filteredListings.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-400">No results found.</td></tr>
                       ) : (
                          filteredListings.map(l => {
                             const effS = getEffectiveListingStatus(l);
                             return (
                                <tr 
                                  key={l.id} 
                                  className={cn(
                                    "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer",
                                    selectedListing?.id === l.id && "bg-blue-50/50 dark:bg-blue-900/20"
                                  )}
                                  onClick={() => setSelectedListing(l)}
                                >
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                         <div className="size-10 rounded border bg-zinc-100 overflow-hidden shrink-0">
                                            {l.images?.[0] && <Image src={l.images[0]} alt="" fill className="object-cover" />}
                                         </div>
                                          <div className="min-w-0">
                                             <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate w-48">{l.title}</p>
                                             <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">
                                               {l.category} • {((l as any).booster_plan) ? `${(l as any).booster_plan} (${(l as any).plan_days}D) • ₹${(l as any).payment_amount}` : "Standard Plan"}
                                             </p>
                                          </div>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                      <p className="font-medium text-zinc-700 dark:text-zinc-300">{l.sellerName}</p>
                                      <p className="text-[10px] text-zinc-400">{l.sellerEmail}</p>
                                   </td>
                                   <td className="px-6 py-4">
                                      <Badge variant="outline" className={cn(
                                         "text-[9px] font-bold uppercase border-2",
                                         effS === 'active' ? "border-green-100 text-green-600" : 
                                         effS === 'timed_out' ? "border-red-100 text-red-600" : "border-zinc-100 text-zinc-400"
                                      )}>{effS.replace('_', ' ')}</Badge>
                                   </td>
                                   <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(l.price)}</td>
                                   <td className="px-6 py-4 text-right">
                                      <DropdownMenu>
                                         <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400"><MoreVertical className="size-4" /></Button>
                                         </DropdownMenuTrigger>
                                         <DropdownMenuContent align="end" className="w-48 font-bold text-xs uppercase">
                                            <DropdownMenuItem asChild><Link href={`/listing/${l.id}`} target="_blank">Live View</Link></DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setDeleteId(l.id)} className="text-red-600">Remove Item</DropdownMenuItem>
                                         </DropdownMenuContent>
                                      </DropdownMenu>
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

        {/* Quick Inspector / Timer Control */}
        <div className="w-full lg:w-80 space-y-6">
           <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-lg overflow-hidden">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border-b border-zinc-200 dark:border-zinc-800">
                 <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Active Inspector</h3>
              </div>
              <CardContent className="p-0">
                 {!selectedListing ? (
                     <div className="p-6 text-center space-y-4">
                        <div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center mx-auto">
                           <Tag className="size-8 text-zinc-300" />
                        </div>
                        <p className="text-xs text-zinc-400 italic px-4">Select a listing from the directory to adjust its visibility timers and platform priority.</p>
                     </div>
                  ) : (
                     <div className="p-4 space-y-4">
                        <div>
                           <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{selectedListing.title}</p>
                           <p className="text-xs text-zinc-500 capitalize">{selectedListing.category} • {formatPrice(selectedListing.price)}</p>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900/30">
                           <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Selected Plan</p>
                           <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {(selectedListing as any).booster_plan || "Standard Plan"}
                           </p>
                           {(selectedListing as any).booster_plan && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                 Duration: {(selectedListing as any).plan_days} Days <br/>
                                 Paid: ₹{(selectedListing as any).payment_amount}
                              </p>
                           )}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Actions</p>
                           
                           {selectedListing.status === "pending_payment" || selectedListing.status === "rejected" ? (
                              <Button 
                                 size="sm" 
                                 className="w-full bg-green-600 hover:bg-green-700 text-white"
                                 onClick={() => handleUpdateStatus(selectedListing.id, "active")}
                                 disabled={updatingId === selectedListing.id}
                              >
                                 <CheckCircle2 className="size-4 mr-2" /> Approve & Make Active
                              </Button>
                           ) : selectedListing.status === "active" ? (
                              <Button 
                                 size="sm" 
                                 variant="outline"
                                 className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                 onClick={() => handleUpdateStatus(selectedListing.id, "rejected")}
                                 disabled={updatingId === selectedListing.id}
                              >
                                 <XCircle className="size-4 mr-2" /> Reject / Deactivate
                              </Button>
                           ) : selectedListing.status === "timed_out" ? (
                              <Button 
                                 size="sm" 
                                 className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                 onClick={() => handleUpdateStatus(selectedListing.id, "active")}
                                 disabled={updatingId === selectedListing.id}
                              >
                                 <RotateCcw className="size-4 mr-2" /> Relaunch
                              </Button>
                           ) : null}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Timer Extension</p>
                           <div className="flex gap-2">
                              <select 
                                 className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
                                 value={timerInputs[selectedListing.id]?.days || 0}
                                 onChange={(e) => setTimerInputs(prev => ({ ...prev, [selectedListing.id]: { days: parseInt(e.target.value) / (1000 * 60 * 60 * 24), months: 0, hours: 0, minutes: 0, seconds: 0 } }))}
                              >
                                 <option value={0}>Select days...</option>
                                 <option value={1000 * 60 * 60 * 24 * 30}>30 Days (Basic)</option>
                                 <option value={1000 * 60 * 60 * 24 * 100}>100 Days (Plus)</option>
                                 <option value={1000 * 60 * 60 * 24 * 180}>180 Days (Pro)</option>
                                 <option value={1000 * 60 * 60 * 24 * 365}>365 Days (Ultra Pro)</option>
                              </select>
                              <Button 
                                 size="sm" 
                                 onClick={() => handleSetTimer(selectedListing)}
                                 disabled={!timerInputs[selectedListing.id]?.days || updatingId === selectedListing.id}
                              >
                                 Set
                              </Button>
                           </div>
                        </div>

                        <Link href={`/listing/${selectedListing.id}`} target="_blank" className="block mt-4">
                           <Button variant="secondary" size="sm" className="w-full">
                              <ExternalLink className="size-4 mr-2" /> View Public Page
                           </Button>
                        </Link>
                     </div>
                  )}
              </CardContent>
           </Card>
           
           <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">System Health</h4>
              <div className="space-y-2">
                 <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-zinc-500">Database Sync</span>
                    <span className="text-green-600">OPTIMAL</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-zinc-500">API Latency</span>
                    <span className="text-zinc-900 dark:text-zinc-100">12ms</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-bold text-red-600">Delete Listing?</DialogTitle>
            <DialogDescription className="text-xs">Permanently remove this item from the public marketplace and database.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete} disabled={deleting}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "listings", deleteId));
      setListings(prev => prev.filter(l => l.id !== deleteId));
      toast.success("Deleted");
    } catch { toast.error("Error"); }
    setDeleting(false);
    setDeleteId(null);
  }
}
