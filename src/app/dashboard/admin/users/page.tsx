"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Users,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <h1 className="text-2xl font-bold">Admin Users</h1>
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
          <h1 className="text-2xl font-bold">Registered Users Management</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage all users registered on the platform.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="px-3 py-1 font-bold">{users.length} Total Users</Badge>
           <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
             <Users className="size-3 mr-1" /> Verified
           </Badge>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or phone..."
          className="pl-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.length === 0 ? (
          <Card className="col-span-full py-12 text-center border-dashed border-2">
            <p className="text-muted-foreground">No users found matching your search.</p>
          </Card>
        ) : (
          filteredUsers.map((u) => (
            <Card
              key={u.id}
              className="group cursor-pointer rounded-2xl border-2 border-zinc-200/80 bg-white transition-all duration-300 hover:border-blue-300 hover:shadow-3d dark:border-zinc-800/80 dark:bg-zinc-900/80"
              onClick={() => handleUserClick(u)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                    {u.avatar_url ? (
                      <Image
                        src={u.avatar_url}
                        alt={u.full_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="m-auto size-7 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold truncate text-zinc-900 dark:text-zinc-100">{u.full_name}</h3>
                      <Badge 
                        variant={u.role === "admin" ? "default" : "secondary"} 
                        className={`capitalize text-[9px] h-4 px-1.5 ${u.role === "admin" ? "bg-indigo-600" : ""}`}
                      >
                        {u.role}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Mail className="size-3 text-blue-500" />
                        <span className="truncate">{u.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Phone className="size-3 text-green-500" />
                        <span>{u.phone || "No phone"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="self-center p-2 rounded-full bg-zinc-50 dark:bg-zinc-800/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <ChevronRight className="size-4 text-zinc-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                   <span className="text-muted-foreground">Member since {new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                   <span className="font-bold text-blue-600 flex items-center gap-1">
                     View Listings <ExternalLink className="size-2.5" />
                   </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto border-l-2 border-zinc-200 dark:border-zinc-800">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <User className="size-5 text-blue-600" />
              User Profile & Activity
            </SheetTitle>
            <SheetDescription>
              Comprehensive overview of user account and their marketplace activity.
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="space-y-8 pb-12">
              {/* User Identity Card */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-3d dark:border-zinc-800 dark:bg-zinc-900">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Users className="size-24" />
                </div>
                
                <div className="relative flex flex-col items-center gap-4 text-center">
                  <div className="relative size-24 overflow-hidden rounded-2xl border-4 border-zinc-50 bg-zinc-100 shadow-lg dark:border-zinc-800 dark:bg-zinc-800">
                    {selectedUser.avatar_url ? (
                      <Image
                        src={selectedUser.avatar_url}
                        alt={selectedUser.full_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="m-auto size-12 text-zinc-300" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{selectedUser.full_name}</h2>
                    <Badge className="mt-1 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 capitalize border-none">
                      {selectedUser.role} Account
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 w-full mt-4">
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-1">
                       <Mail className="size-4 text-blue-500" />
                       <span className="text-[10px] font-bold text-zinc-400 uppercase">Email</span>
                       <span className="text-xs font-medium truncate w-full">{selectedUser.email || "N/A"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-1">
                       <Phone className="size-4 text-green-500" />
                       <span className="text-[10px] font-bold text-zinc-400 uppercase">Phone</span>
                       <span className="text-xs font-medium">{selectedUser.phone || "N/A"}</span>
                    </div>
                  </div>
                  
                  <div className="w-full pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Joined on {new Date(selectedUser.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* User Listings Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-zinc-100 dark:border-zinc-800 pb-2">
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <Building className="size-5 text-indigo-600" />
                    Marketplace Listings
                  </h3>
                  <Badge variant="outline" className="font-bold bg-zinc-50 dark:bg-zinc-800/50">
                    {userListings.length} Items
                  </Badge>
                </div>

                {loadingListings ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : userListings.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                       <Building className="size-6 text-zinc-300" />
                    </div>
                    <p className="text-muted-foreground font-medium">This user hasn&apos;t posted any listings yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userListings.map((listing) => (
                      <Card 
                        key={listing.id} 
                        className="overflow-hidden border-2 border-zinc-200/80 bg-white transition-all hover:border-blue-200 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80"
                      >
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-4">
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
                              {listing.images?.[0] ? (
                                <Image
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-400 font-bold">NO IMAGE</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-bold text-sm truncate text-zinc-900 dark:text-zinc-100">{listing.title}</h4>
                                  <Badge 
                                    className={`text-[9px] h-4 px-1.5 capitalize border-none ${
                                      listing.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      listing.status === 'timed_out' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}
                                  >
                                    {listing.status}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                   <Building className="size-2.5" />
                                   {listing.address}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-sm font-black text-blue-600">{formatPrice(listing.price)}</p>
                                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" asChild>
                                  <Link href={`/listing/${listing.id}`} target="_blank">
                                    OPEN <ExternalLink className="size-2.5 ml-1" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
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
