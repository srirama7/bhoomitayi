"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  ShieldAlert,
  User,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import type { Profile, Listing } from "@/lib/types/database";
import { formatPrice } from "@/lib/constants";
import Link from "next/link";

export default function AdminUsersPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, "profiles"),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(usersQuery);
        const allUsers = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Profile
        );
        setUsers(allUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users");
      }
      setLoading(false);
    };

    fetchUsers();
  }, [user, profile, authLoading]);

  const handleUserClick = async (clickedUser: Profile) => {
    setSelectedUser(clickedUser);
    setLoadingListings(true);
    setUserListings([]);

    try {
      const listingsQuery = query(
        collection(db, "listings"),
        where("user_id", "==", clickedUser.id),
        orderBy("created_at", "desc")
      );
      const snap = await getDocs(listingsQuery);
      const listings = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Listing
      );
      setUserListings(listings);
    } catch (error) {
      console.error("Failed to fetch user listings:", error);
      toast.error("Failed to load user listings");
    }
    setLoadingListings(false);
  };

  const filteredUsers = users.filter((u) => {
    const search = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.phone?.toLowerCase().includes(search)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Registered Users</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    return (
      <Card className="rounded-2xl border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <ShieldAlert className="size-10 text-red-600 dark:text-red-400" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registered Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage and view all users registered on the platform.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl">
            <p className="text-muted-foreground">No users found.</p>
          </div>
        ) : (
          filteredUsers.map((u) => (
            <Card
              key={u.id}
              className="group cursor-pointer rounded-2xl border-2 transition-all hover:border-primary/50 hover:shadow-lg"
              onClick={() => handleUserClick(u)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-full border-2 border-muted bg-muted">
                    {u.avatar_url ? (
                      <Image
                        src={u.avatar_url}
                        alt={u.full_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="m-auto size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold truncate">{u.full_name}</h3>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize text-[10px] h-5">
                        {u.role}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="size-3" />
                        <span className="truncate">{u.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="size-3" />
                        <span>{u.phone || "No phone"}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-5 self-center text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Viewing information and listings for {selectedUser?.full_name}.
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="space-y-8">
              {/* User Info Section */}
              <div className="flex flex-col items-center gap-4 text-center p-6 rounded-2xl bg-muted/30">
                <div className="relative size-24 overflow-hidden rounded-full border-4 border-background bg-muted">
                  {selectedUser.avatar_url ? (
                    <Image
                      src={selectedUser.avatar_url}
                      alt={selectedUser.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="m-auto size-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.full_name}</h2>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-primary" />
                    <span>{selectedUser.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-primary" />
                    <span>Joined {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Listings Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">User Listings ({userListings.length})</h3>
                </div>

                {loadingListings ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : userListings.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed rounded-2xl">
                    <p className="text-muted-foreground">This user has no listings.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userListings.map((listing) => (
                      <Card key={listing.id} className="overflow-hidden border-2 hover:border-primary/30 transition-colors">
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border">
                              {listing.images?.[0] ? (
                                <Image
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted text-[10px]">No Image</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-sm truncate">{listing.title}</h4>
                                <Badge variant="secondary" className="text-[9px] h-4 capitalize">
                                  {listing.status}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">{listing.address}</p>
                              <p className="text-xs font-bold text-blue-600 mt-1">{formatPrice(listing.price)}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="self-center" asChild>
                              <Link href={`/listing/${listing.id}`} target="_blank">
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
