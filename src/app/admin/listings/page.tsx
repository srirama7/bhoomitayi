"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  Search,
  Eye,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";
import type { Listing, Profile } from "@/lib/types/database";

type ListingWithOwner = Listing & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

type StatusFilter = "all" | "pending" | "active" | "rejected" | "timed_out";

export default function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<
    "approve" | "reject" | "delete" | "relaunch" | null
  >(null);
  const [selectedListing, setSelectedListing] =
    useState<ListingWithOwner | null>(null);

  // Timing state
  const [timingDialogOpen, setTimingDialogOpen] = useState(false);
  const [years, setYears] = useState("0");
  const [months, setMonths] = useState("0");
  const [days, setDays] = useState("0");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");

  const fetchListings = useCallback(async () => {
    setLoading(true);

    try {
      const listingsQuery = query(
        collection(db, "listings"),
        orderBy("created_at", "desc")
      );
      const listingsSnap = await getDocs(listingsQuery);

      const listingsData: ListingWithOwner[] = await Promise.all(
        listingsSnap.docs.map(async (listingDoc) => {
          const data = listingDoc.data();
          let ownerProfile: Pick<Profile, "full_name" | "email"> | null = null;

          if (data.user_id) {
            try {
              const profileSnap = await getDoc(
                doc(db, "profiles", data.user_id)
              );
              if (profileSnap.exists()) {
                ownerProfile = {
                  full_name: profileSnap.data().full_name,
                  email: profileSnap.data().email,
                };
              }
            } catch {
              // Owner profile not found
            }
          }

          const listing = {
            id: listingDoc.id,
            ...data,
            profiles: ownerProfile,
          } as ListingWithOwner;

          // Auto-update status if expired
          if (listing.status === "active" && listing.expires_at) {
            const expiryDate = new Date(listing.expires_at);
            if (expiryDate < new Date()) {
              await updateDoc(doc(db, "listings", listing.id), {
                status: "timed_out",
              });
              listing.status = "timed_out";
            }
          }

          return listing;
        })
      );

      setListings(listingsData);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredListings =
    activeTab === "all"
      ? listings
      : listings.filter((l) => l.status === activeTab);

  const openConfirmDialog = (
    listing: ListingWithOwner,
    action: "approve" | "reject" | "delete" | "relaunch"
  ) => {
    setSelectedListing(listing);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const openTimingDialog = (listing: ListingWithOwner) => {
    setSelectedListing(listing);
    // Pre-fill with remaining time if listing has an active timer
    if (listing.expires_at) {
      const diff = new Date(listing.expires_at).getTime() - Date.now();
      if (diff > 0) {
        const totalMins = Math.floor(diff / 60000);
        const totalHrs = Math.floor(totalMins / 60);
        const totalDays = Math.floor(totalHrs / 24);
        const totalMonths = Math.floor(totalDays / 30);
        const totalYears = Math.floor(totalMonths / 12);
        setYears(String(totalYears));
        setMonths(String(totalMonths % 12));
        setDays(String(totalDays % 30));
        setHours(String(totalHrs % 24));
        setMinutes(String(totalMins % 60));
      } else {
        setYears("0"); setMonths("0"); setDays("0"); setHours("0"); setMinutes("0");
      }
    } else {
      setYears("0"); setMonths("0"); setDays("0"); setHours("0"); setMinutes("0");
    }
    setTimingDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedListing || !dialogAction) return;

    setActionLoading(selectedListing.id);

    try {
      if (dialogAction === "delete") {
        await deleteDoc(doc(db, "listings", selectedListing.id));
        toast.success("Listing deleted successfully");
      } else if (dialogAction === "relaunch") {
        await updateDoc(doc(db, "listings", selectedListing.id), {
          status: "active",
          expires_at: null,
          updated_at: new Date().toISOString(),
        });
        toast.success("Listing relaunched successfully");
      } else {
        const newStatus = dialogAction === "approve" ? "active" : "rejected";
        await updateDoc(doc(db, "listings", selectedListing.id), {
          status: newStatus,
          updated_at: new Date().toISOString(),
        });
        if (dialogAction === "approve") {
          await sendListingApprovalEmail(selectedListing);
        }
        toast.success(
          `Listing ${dialogAction === "approve" ? "approved" : "rejected"} successfully`
        );
      }

      await fetchListings();
    } catch (error) {
      console.error(`Error performing ${dialogAction}:`, error);
      toast.error(`Failed to ${dialogAction} listing`);
    } finally {
      setActionLoading(null);
      setDialogOpen(false);
      setSelectedListing(null);
      setDialogAction(null);
    }
  };

  const handleSetTiming = async () => {
    if (!selectedListing) return;

    const totalMs =
      parseInt(years || "0") * 365 * 24 * 60 * 60 * 1000 +
      parseInt(months || "0") * 30 * 24 * 60 * 60 * 1000 +
      parseInt(days || "0") * 24 * 60 * 60 * 1000 +
      parseInt(hours || "0") * 60 * 60 * 1000 +
      parseInt(minutes || "0") * 60 * 1000;

    if (totalMs <= 0) {
      toast.error("Please set a valid duration");
      return;
    }

    const expiresAt = new Date(Date.now() + totalMs).toISOString();
    setActionLoading(selectedListing.id);

    try {
      await updateDoc(doc(db, "listings", selectedListing.id), {
        expires_at: expiresAt,
        status: "active",
        updated_at: new Date().toISOString(),
      });
      if (selectedListing.status !== "active") {
        await sendListingApprovalEmail(selectedListing);
      }
      toast.success("Timing set successfully — listing is now active");
      await fetchListings();
    } catch (error) {
      console.error("Error setting timing:", error);
      toast.error("Failed to set timing");
    } finally {
      setActionLoading(null);
      setTimingDialogOpen(false);
      setSelectedListing(null);
      setYears("0");
      setMonths("0");
      setDays("0");
      setHours("0");
      setMinutes("0");
    }
  };

  const handleClearTiming = async () => {
    if (!selectedListing) return;
    setActionLoading(selectedListing.id);
    try {
      await updateDoc(doc(db, "listings", selectedListing.id), {
        expires_at: null,
        updated_at: new Date().toISOString(),
      });
      toast.success("Timer removed — listing has no expiry");
      await fetchListings();
    } catch (error) {
      console.error("Error clearing timing:", error);
      toast.error("Failed to clear timing");
    } finally {
      setActionLoading(null);
      setTimingDialogOpen(false);
      setSelectedListing(null);
    }
  };

  const getStatusBadge = (status: Listing["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            Pending
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Active
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            Rejected
          </Badge>
        );
      case "timed_out":
        return (
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            Timed Out
          </Badge>
        );
      case "sold":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            Sold
          </Badge>
        );
      case "archived":
        return (
          <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
            Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDialogDetails = () => {
    if (!dialogAction || !selectedListing) return { title: "", description: "" };

    switch (dialogAction) {
      case "approve":
        return {
          title: "Approve Listing",
          description: `Are you sure you want to approve "${selectedListing.title}"? This will make the listing visible to all users.`,
        };
      case "reject":
        return {
          title: "Reject Listing",
          description: `Are you sure you want to reject "${selectedListing.title}"? The listing will not be visible to users.`,
        };
      case "delete":
        return {
          title: "Delete Listing",
          description: `Are you sure you want to permanently delete "${selectedListing.title}"? This action cannot be undone.`,
        };
      case "relaunch":
        return {
          title: "Relaunch Listing",
          description: `Are you sure you want to relaunch "${selectedListing.title}"? This will reset the timing and set it to active.`,
        };
    }
  };

  const pendingCount = listings.filter((l) => l.status === "pending").length;
  const activeCount = listings.filter((l) => l.status === "active").length;
  const rejectedCount = listings.filter((l) => l.status === "rejected").length;
  const timedOutCount = listings.filter((l) => l.status === "timed_out").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Listings</h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, or reject property listings.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">All ({listings.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="timed_out">Timed Out ({timedOutCount})</TabsTrigger>
        </TabsList>

        {/* All tabs share the same content structure */}
        {(["all", "pending", "active", "rejected", "timed_out"] as StatusFilter[]).map(
          (tab) => (
            <TabsContent key={tab} value={tab}>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
              ) : filteredListings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Search className="text-muted-foreground mb-4 size-12" />
                    <p className="text-muted-foreground text-lg font-medium">
                      No listings found
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {tab === "all"
                        ? "There are no listings in the system yet."
                        : `There are no ${tab.replace("_", " ")} listings.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-muted-foreground border-b text-left text-sm">
                            <th className="px-4 py-3 font-medium">Title</th>
                            <th className="px-4 py-3 font-medium">Category</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Timer</th>
                            <th className="px-4 py-3 font-medium">Price</th>
                            <th className="px-4 py-3 font-medium">Owner</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredListings.map((listing) => (
                            <tr key={listing.id} className="hover:bg-muted/50">
                              <td className="max-w-[200px] truncate px-4 py-3 text-sm font-medium">
                                {listing.title}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="capitalize">
                                  {listing.category}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {getStatusBadge(listing.status)}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {listing.expires_at ? (
                                  new Date(listing.expires_at) > new Date() ? (
                                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                                      <Clock className="size-3 mr-1" />
                                      {new Date(listing.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{" "}
                                      {new Date(listing.expires_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">
                                      Expired
                                    </Badge>
                                  )
                                ) : (
                                  <span className="italic">No Timer</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {formatPrice(listing.price)}
                              </td>
                              <td className="text-muted-foreground px-4 py-3 text-sm">
                                {listing.profiles?.full_name ?? "Unknown"}
                              </td>
                              <td className="text-muted-foreground px-4 py-3 text-sm">
                                {new Date(
                                  listing.created_at
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    title="View listing"
                                    onClick={() =>
                                      router.push(`/listing/${listing.id}`)
                                    }
                                  >
                                    <Eye className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    title="Set Timer"
                                    className="text-blue-600 hover:text-blue-700"
                                    disabled={actionLoading === listing.id}
                                    onClick={() => openTimingDialog(listing)}
                                  >
                                    <Clock className="size-3.5" />
                                  </Button>
                                  {(listing.status === "timed_out" || listing.status === "rejected") && (
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      title="Relaunch"
                                      className="text-indigo-600 hover:text-indigo-700"
                                      disabled={actionLoading === listing.id}
                                      onClick={() =>
                                        openConfirmDialog(listing, "relaunch")
                                      }
                                    >
                                      <RotateCcw className="size-3.5" />
                                    </Button>
                                  )}
                                  {listing.status === "pending" && (
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      title="Approve"
                                      className="text-green-600 hover:text-green-700"
                                      disabled={actionLoading === listing.id}
                                      onClick={() =>
                                        openConfirmDialog(listing, "approve")
                                      }
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                    </Button>
                                  )}
                                  {listing.status !== "rejected" && listing.status !== "timed_out" && (
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      title="Reject"
                                      className="text-yellow-600 hover:text-yellow-700"
                                      disabled={actionLoading === listing.id}
                                      onClick={() =>
                                        openConfirmDialog(listing, "reject")
                                      }
                                    >
                                      <XCircle className="size-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    title="Delete"
                                    className="text-red-600 hover:text-red-700"
                                    disabled={actionLoading === listing.id}
                                    onClick={() =>
                                      openConfirmDialog(listing, "delete")
                                    }
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )
        )}
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogDetails().title}</DialogTitle>
            <DialogDescription>
              {getDialogDetails().description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              variant={dialogAction === "delete" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : dialogAction === "approve" ? (
                "Approve"
              ) : dialogAction === "reject" ? (
                "Reject"
              ) : dialogAction === "relaunch" ? (
                "Relaunch"
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timing Dialog */}
      <Dialog open={timingDialogOpen} onOpenChange={setTimingDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Set Listing Timer</DialogTitle>
            <DialogDescription>
              Set how long &quot;{selectedListing?.title}&quot; should remain active. Format: Years / Months / Days / Hours / Minutes. Setting a timer will also activate the listing.
            </DialogDescription>
          </DialogHeader>
          {selectedListing?.expires_at && new Date(selectedListing.expires_at) > new Date() && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-600">
              <strong>Current timer expires:</strong>{" "}
              {new Date(selectedListing.expires_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          )}
          <div className="grid grid-cols-5 gap-3 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="years" className="text-xs font-semibold">Years</Label>
              <Input
                id="years"
                type="number"
                min="0"
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="months" className="text-xs font-semibold">Months</Label>
              <Input
                id="months"
                type="number"
                min="0"
                max="11"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="days" className="text-xs font-semibold">Days</Label>
              <Input
                id="days"
                type="number"
                min="0"
                max="30"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hours" className="text-xs font-semibold">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mins" className="text-xs font-semibold">Mins</Label>
              <Input
                id="mins"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearTiming}
              disabled={actionLoading !== null || !selectedListing?.expires_at}
              className="mr-auto"
            >
              Clear Timer
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setTimingDialogOpen(false)}
                disabled={actionLoading !== null}
              >
                Cancel
              </Button>
              <Button onClick={handleSetTiming} disabled={actionLoading !== null}>
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Set & Approve"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function sendListingApprovalEmail(listing: ListingWithOwner) {
  const ownerEmail = listing.owner_email || listing.profiles?.email;
  if (!ownerEmail) {
    console.warn("Approval email skipped because owner_email is missing.", {
      listingId: listing.id,
    });
    return;
  }

  const response = await fetch("/api/listings/approval-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      listingId: listing.id,
      listingTitle: listing.title,
      ownerEmail,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    console.error("Approval email failed:", data);
    toast.warning("Listing updated, but approval email was not sent.");
  }
}

