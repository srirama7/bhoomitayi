"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShieldCheck, ShieldOff, Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [targetRole, setTargetRole] = useState<"admin" | "user">("user");

  const fetchProfiles = useCallback(async () => {
    setLoading(true);

    try {
      const profilesQuery = query(
        collection(db, "profiles"),
        orderBy("created_at", "desc")
      );
      const profilesSnap = await getDocs(profilesQuery);

      const profilesData: Profile[] = profilesSnap.docs.map((profileDoc) => ({
        id: profileDoc.id,
        ...profileDoc.data(),
      })) as Profile[];

      setProfiles(profilesData);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const openRoleDialog = (profile: Profile, newRole: "admin" | "user") => {
    setSelectedUser(profile);
    setTargetRole(newRole);
    setDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.id);

    try {
      await updateDoc(doc(db, "profiles", selectedUser.id), {
        role: targetRole,
      });

      toast.success(
        targetRole === "admin"
          ? `${selectedUser.full_name} is now an admin`
          : `Admin access removed from ${selectedUser.full_name}`
      );

      await fetchProfiles();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setActionLoading(null);
      setDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const adminCount = profiles.filter((p) => p.role === "admin").length;
  const userCount = profiles.filter((p) => p.role === "user").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground mt-1">
          View and manage user accounts and roles.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{profiles.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Admins
            </CardTitle>
            <ShieldCheck className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{adminCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Regular Users
            </CardTitle>
            <Users className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{userCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="text-muted-foreground mb-4 size-12" />
            <p className="text-muted-foreground text-lg font-medium">
              No users found
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              There are no registered users yet.
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
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {profiles.map((profile) => {
                    const isSelf = profile.id === user?.uid;
                    const isAdmin = profile.role === "admin";

                    return (
                      <tr key={profile.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {profile.full_name}
                            </span>
                            {isSelf && (
                              <span className="text-muted-foreground text-xs">
                                (You)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin ? (
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-sm">
                          {new Date(profile.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isSelf ? (
                            <span className="text-muted-foreground text-xs italic">
                              Cannot modify own role
                            </span>
                          ) : isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-yellow-600 hover:text-yellow-700"
                              disabled={actionLoading === profile.id}
                              onClick={() => openRoleDialog(profile, "user")}
                            >
                              {actionLoading === profile.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ShieldOff className="size-3.5" />
                              )}
                              Remove Admin
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              disabled={actionLoading === profile.id}
                              onClick={() => openRoleDialog(profile, "admin")}
                            >
                              {actionLoading === profile.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="size-3.5" />
                              )}
                              Make Admin
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Change Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {targetRole === "admin"
                ? "Grant Admin Access"
                : "Remove Admin Access"}
            </DialogTitle>
            <DialogDescription>
              {targetRole === "admin"
                ? `Are you sure you want to make "${selectedUser?.full_name}" an admin? They will have full access to the admin panel and can manage listings and users.`
                : `Are you sure you want to remove admin access from "${selectedUser?.full_name}"? They will lose access to the admin panel.`}
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
              variant={targetRole === "user" ? "destructive" : "default"}
              onClick={handleRoleChange}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : targetRole === "admin" ? (
                "Grant Admin"
              ) : (
                "Remove Admin"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
