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
  Search,
  Users,
  Building,
  Filter,
  MoreVertical,
  Shield,
  Eye,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <div className="p-0">
             {Array.from({ length: 8 }).map((_, i) => (
               <Skeleton key={i} className="h-16 w-full border-b last:border-0" />
             ))}
          </div>
        </Card>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">User Directory</h1>
          <p className="text-sm text-zinc-500">Manage all registered accounts and monitor user activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 border-zinc-200 dark:border-zinc-800">
            <Filter className="size-4 mr-2" /> Filter
          </Button>
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 px-3 py-1 text-xs font-bold">
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search users..."
            className="pl-9 h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus-visible:ring-zinc-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">User</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Contact</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Role</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Joined Date</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                    onClick={() => handleUserClick(u)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt="" fill className="object-cover" />
                          ) : (
                            <User className="m-auto size-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{u.full_name}</p>
                          <p className="text-xs text-zinc-400 truncate font-mono">ID: {u.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                          <Mail className="size-3.5 text-zinc-400" /> {u.email || "No Email"}
                        </p>
                        <p className="flex items-center gap-1.5 text-zinc-500 text-xs">
                          <Phone className="size-3.5 text-zinc-400" /> {u.phone || "No Phone"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          u.role === "admin" ? "bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900" : ""
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(u.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleUserClick(u)}>
                          <Eye className="size-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>User Management</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUserClick(u)}>
                              <Eye className="size-4 mr-2" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="size-4 mr-2" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Block User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full border-l border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <SheetHeader className="text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative size-16 overflow-hidden rounded-xl border-2 border-white dark:border-zinc-800 shadow-sm bg-zinc-100 dark:bg-zinc-800">
                  {selectedUser?.avatar_url ? (
                    <Image src={selectedUser.avatar_url} alt="" fill className="object-cover" />
                  ) : (
                    <User className="m-auto size-8 text-zinc-300" />
                  )}
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold">{selectedUser?.full_name}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="text-[10px] bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">{selectedUser?.role.toUpperCase()}</Badge>
                    <span className="text-xs text-zinc-500">ID: {selectedUser?.id}</span>
                  </div>
                </div>
              </div>
              <SheetDescription className="text-zinc-500">
                Created on {selectedUser && new Date(selectedUser.created_at).toLocaleString()}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Management Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Listings</span>
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{userListings.length}</span>
               </div>
               <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active Status</span>
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                    <div className="size-2 rounded-full bg-green-500" /> ONLINE
                  </span>
               </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Account Details</h3>
              <div className="grid gap-3">
                <DetailRow icon={Mail} label="Email Address" value={selectedUser?.email || "N/A"} />
                <DetailRow icon={Phone} label="Phone Number" value={selectedUser?.phone || "N/A"} />
                <DetailRow icon={Calendar} label="Join Date" value={selectedUser ? new Date(selectedUser.created_at).toLocaleDateString() : "N/A"} />
              </div>
            </div>

            {/* Marketplace Listings */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                Marketplace Inventory
                <Badge variant="outline" className="text-[10px]">{userListings.length}</Badge>
              </h3>

              {loadingListings ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : userListings.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                  <Building className="size-8 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No listings found for this user.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userListings.map((listing) => (
                    <div 
                      key={listing.id}
                      className="flex items-center gap-4 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 transition-colors"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800">
                        {listing.images?.[0] ? (
                          <Image src={listing.images[0]} alt="" fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-[10px] text-zinc-300">N/A</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{listing.title}</p>
                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5">{formatPrice(listing.price)}</p>
                      </div>
                      <Badge className="text-[9px] capitalize">{listing.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                         <Link href={`/listing/${listing.id}`} target="_blank">
                            <ExternalLink className="size-3.5" />
                         </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedUser(null)}>Close</Button>
            <Button className="flex-1 bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">Manage Account</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-500">{label}</span>
      </div>
      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}
