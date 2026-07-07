"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getListingUrl } from "@/lib/firebase/native-auth";
import {
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Building,
  User,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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
        const snap = await getDocs(query(collection(db, "profiles"), orderBy("created_at", "desc")));
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Profile));
      } catch (error) {
        console.error("Fetch users error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user, profile, authLoading]);

  const handleUserClick = async (clickedUser: Profile) => {
    setSelectedUser(clickedUser);
    setLoadingListings(true);
    try {
      const snap = await getDocs(query(collection(db, "listings"), where("user_id", "==", clickedUser.id), orderBy("created_at", "desc")));
      setUserListings(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Listing));
    } catch (error) {
      console.error("Fetch listings error:", error);
    } finally {
      setLoadingListings(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-[500px] w-full" /></div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Users</h1>
          <p className="text-sm text-zinc-500">Manage your user base, roles, and review their activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 border-zinc-200 dark:border-zinc-800">
            <Download className="size-4 mr-2" /> Export
          </Button>
          <Button size="sm" className="h-9 bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
            Add User
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input 
            placeholder="Search by name, email or phone..." 
            className="pl-9 h-10 border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50/50 dark:bg-zinc-950/50" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-10 border-zinc-200 dark:border-zinc-800 flex-1 sm:flex-none">
            <Filter className="size-4 mr-2" /> Status
          </Button>
          <Button variant="outline" size="sm" className="h-10 border-zinc-200 dark:border-zinc-800 flex-1 sm:flex-none">
            Role
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500 uppercase text-[11px] tracking-wider">User</th>
                <th className="px-6 py-4 font-medium text-zinc-500 uppercase text-[11px] tracking-wider">Email</th>
                <th className="px-6 py-4 font-medium text-zinc-500 uppercase text-[11px] tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium text-zinc-500 uppercase text-[11px] tracking-wider">Role</th>
                <th className="px-6 py-4 font-medium text-zinc-500 uppercase text-[11px] tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    onClick={() => handleUserClick(u)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt="" fill className="object-cover" />
                          ) : (
                            <User className="size-5 text-zinc-400" />
                          )}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="size-1.5 rounded-full bg-green-500" />
                        <span className="text-xs text-zinc-700 dark:text-zinc-300">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-medium uppercase px-2 py-0.5 rounded border",
                        u.role === 'admin' ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100" : "border-zinc-200 text-zinc-500"
                      )}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUserClick(u)}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Deactivate Account</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 flex items-center justify-between">
           <p className="text-xs text-zinc-500">Showing {filteredUsers.length} of {users.length} users</p>
           <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="h-8 text-xs">Previous</Button>
              <Button variant="outline" size="sm" disabled className="h-8 text-xs">Next</Button>
           </div>
        </div>
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-2xl p-0 overflow-hidden border-l border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            {/* User Profile Header */}
            <div className="p-8 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-5">
                  <div className="size-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                    {selectedUser?.avatar_url ? (
                      <Image src={selectedUser.avatar_url} alt="" fill className="object-cover" />
                    ) : (
                      <User className="size-8 text-zinc-300" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{selectedUser?.full_name}</h2>
                    <p className="text-sm text-zinc-500">{selectedUser?.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{selectedUser?.role}</Badge>
                      <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 uppercase">Verified</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-9 border-zinc-200">Edit Profile</Button>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Account ID</p>
                  <p className="text-sm font-mono text-zinc-600 dark:text-zinc-300">{selectedUser?.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{selectedUser?.phone || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Registration Date</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {selectedUser && new Date(selectedUser.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Last Active</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Just now</p>
                </div>
              </div>
            </div>

            {/* User Activity / Listings */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Platform Listings</h3>
                  <span className="text-xs text-zinc-500">{userListings.length} items total</span>
                </div>

                {loadingListings ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : userListings.length === 0 ? (
                  <div className="py-12 text-center border border-dashed rounded-lg border-zinc-200 bg-zinc-50/50">
                    <Building className="size-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">No active or past listings found.</p>
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                    {userListings.map(l => (
                      <div key={l.id} className="p-4 bg-white dark:bg-zinc-900/50 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded bg-zinc-100 dark:bg-zinc-800 border overflow-hidden shrink-0">
                            {l.images?.[0] && <Image src={l.images[0]} alt="" fill className="object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate w-64">{l.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{l.category}</span>
                              <span className="text-[10px] text-zinc-300">•</span>
                              <span className="text-[10px] font-bold text-blue-600">{formatPrice(l.price)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[9px] uppercase font-semibold h-5">{l.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 group-hover:text-zinc-900" asChild>
                            <Link href={getListingUrl(l.id)} target="_blank"><ExternalLink className="size-3.5" /></Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Management Notes</h3>
                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
                   <p className="text-xs text-zinc-500 leading-relaxed italic">No administrative notes have been added for this account yet.</p>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedUser(null)}>Dismiss</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none">Suspend Account</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
