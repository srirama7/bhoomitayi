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
  Building,
  MoreHorizontal,
  ArrowUpDown,
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
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full rounded-2xl" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">User Directory</h1>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="font-bold">{users.length} Users</Badge>
           <Button variant="default" className="bg-blue-600 text-white hover:bg-blue-700 h-9 font-bold px-4">Export CSV</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input 
              placeholder="Search users..." 
              className="pl-9 h-9 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-xs" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/80">
              <tr>
                <th className="px-6 py-3 font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">User Name</th>
                <th className="px-6 py-3 font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">Contact Email</th>
                <th className="px-6 py-3 font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">Role Status</th>
                <th className="px-6 py-3 font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">Reg. Date</th>
                <th className="px-6 py-3 font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.map((u) => (
                <tr 
                  key={u.id} 
                  className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                  onClick={() => handleUserClick(u)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-zinc-400">
                        {u.full_name?.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-medium">{u.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase px-2 h-5 border-2",
                      u.role === 'admin' ? "border-blue-200 text-blue-600 bg-blue-50" : "border-zinc-200 text-zinc-500"
                    )}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-bold">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-600">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 font-bold text-xs uppercase">
                        <DropdownMenuItem onClick={() => handleUserClick(u)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Modify Access</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Suspend Account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-xl p-0 h-full border-l-2 border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col h-full bg-zinc-50/30 dark:bg-zinc-950/30">
            <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-6">
                 <div className="size-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    {selectedUser?.avatar_url ? (
                      <Image src={selectedUser.avatar_url} alt="" fill className="object-cover rounded-2xl" />
                    ) : (
                      <User className="size-10 text-zinc-300" />
                    )}
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{selectedUser?.full_name}</h2>
                    <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">{selectedUser?.role} Account Control</p>
                    <div className="flex gap-2 mt-2">
                       <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase">Verified User</Badge>
                       <Badge variant="outline" className="text-[9px] font-black uppercase">Active</Badge>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Account Identification</h3>
                <div className="grid grid-cols-2 gap-4">
                   <InfoBlock label="Email Address" value={selectedUser?.email || "N/A"} />
                   <InfoBlock label="Phone Number" value={selectedUser?.phone || "N/A"} />
                   <InfoBlock label="Registration Date" value={selectedUser ? new Date(selectedUser.created_at).toLocaleDateString() : "N/A"} />
                   <InfoBlock label="Internal ID" value={selectedUser?.id.substring(0, 12) || "N/A"} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Inventory Management</h3>
                   <Badge className="bg-zinc-900 text-white text-[9px] font-black">{userListings.length} ITEMS</Badge>
                </div>
                
                <div className="space-y-3">
                  {userListings.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-300 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="size-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border overflow-hidden">
                             {l.images?.[0] && <Image src={l.images[0]} alt="" fill className="object-cover" />}
                          </div>
                          <div>
                             <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate w-48">{l.title}</p>
                             <p className="text-[10px] text-blue-600 font-black mt-0.5">{formatPrice(l.price)}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase">{l.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" asChild>
                             <Link href={`/listing/${l.id}`} target="_blank"><ExternalLink className="size-3.5" /></Link>
                          </Button>
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-4">
               <Button variant="outline" className="flex-1 font-black uppercase text-xs h-11 tracking-wider" onClick={() => setSelectedUser(null)}>Dismiss</Button>
               <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs h-11 tracking-wider">Access Controls</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoBlock({ label, value }: any) {
  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
       <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{value}</p>
    </div>
  );
}
