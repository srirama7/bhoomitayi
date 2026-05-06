"use client";

import { useEffect, useState } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { uploadProfilePicture, validateImage } from "@/lib/image-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, profile, setProfile, loading: authLoading } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
    setLoading(false);
  }, [profile, authLoading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const error = validateImage(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadProfilePicture(file, user.uid);
      setAvatarUrl(url);
      toast.success("Image uploaded! Don't forget to save changes.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

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

            <div className="grid gap-4">
              <Label>Profile Picture</Label>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="relative group">
                  <Avatar className="size-24 border-2 border-background shadow-md">
                    <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400 text-3xl font-bold">
                      {fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-[1px]">
                      <Loader2 className="size-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg h-9"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploading}
                    >
                      <Camera className="mr-2 size-4" />
                      {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setAvatarUrl('')}
                        disabled={uploading}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    Recommended: Square JPG, PNG or WebP. Max 5MB.
                  </p>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving || uploading} className="w-fit rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
