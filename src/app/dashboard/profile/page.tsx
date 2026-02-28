"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";

export default function ProfilePage() {
  const { user, profile, setProfile, loading: authLoading } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
    setLoading(false);
  }, [profile, authLoading]);

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);

    const updates = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, updates);

      // Re-fetch the profile to get the full updated document
      const updatedSnap = await getDoc(profileRef);
      if (updatedSnap.exists()) {
        setProfile({ id: updatedSnap.id, ...updatedSnap.data() } as never);
      }

      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }

    setSaving(false);
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Profile</h1>

      <Card className="max-w-2xl rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <User className="size-4 text-white" />
            </div>
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste a URL to your profile picture.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-fit rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
