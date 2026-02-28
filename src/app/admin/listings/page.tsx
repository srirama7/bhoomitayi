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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  profiles: Pick<Profile, "full_name"> | null;
};

type StatusFilter = "all" | "pending" | "active" | "rejected";

export default function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<
    "approve" | "reject" | "delete" | null
  >(null);
  const [selectedListing, setSelectedListing] =
    useState<ListingWithOwner | null>(null);

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
          let ownerProfile: Pick<Profile, "full_name"> | null = null;

          if (data.user_id) {
            try {
              const profileSnap = await getDoc(
                doc(db, "profiles", data.user_id)
              );
              if (profileSnap.exists()) {
                ownerProfile = {
                  full_name: profileSnap.data().full_name,
                };
              }
            } catch {
              // Owner profile not found
            }
          }

          return {
            id: listingDoc.id,
            ...data,
            profiles: ownerProfile,
          } as ListingWithOwner;
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
    action: "approve" | "reject" | "delete"
  ) => {
    setSelectedListing(listing);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedListing || !dialogAction) return;

    setActionLoading(selectedListing.id);

    try {
      if (dialogAction === "delete") {
        await deleteDoc(doc(db, "listings", selectedListing.id));
        toast.success("Listing deleted successfully");
      } else {
        const newStatus = dialogAction === "approve" ? "active" : "rejected";
        await updateDoc(doc(db, "listings", selectedListing.id), {
          status: newStatus,
        });
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
    }
  };

  const pendingCount = listings.filter((l) => l.status === "pending").length;
  const activeCount = listings.filter((l) => l.status === "active").length;
  const rejectedCount = listings.filter((l) => l.status === "rejected").length;

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
        </TabsList>

        {/* All tabs share the same content structure */}
        {(["all", "pending", "active", "rejected"] as StatusFilter[]).map(
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
                        : `There are no ${tab} listings.`}
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
                                  {listing.status !== "active" && (
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
                                  {listing.status !== "rejected" && (
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
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
