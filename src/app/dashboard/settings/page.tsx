"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Settings,
  Globe,
  Bell,
  Palette,
  Shield,
  Sun,
  Moon,
  Monitor,
  Trash2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/firebase/config";
import { signOut, deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

export default function SettingsPage() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const { i18n, t } = useTranslation();
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inquiryAlerts, setInquiryAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    toast.success("Language updated!");
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setProfile(null);
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    try {
      await deleteUser(auth.currentUser);
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setProfile(null);
      toast.success("Account deleted successfully");
      router.push("/");
    } catch {
      toast.error("Failed to delete account. Please sign in again and retry.");
    }
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-zinc-600 to-zinc-800 shadow-lg shadow-zinc-500/25">
            <Settings className="size-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground">Manage your preferences, notifications, and account settings.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Language Settings */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Globe className="size-4 text-white" />
              </div>
              Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Preferred Language</Label>
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeLabel} ({lang.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This changes the language across the entire app.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Palette className="size-4 text-white" />
              </div>
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Theme</Label>
              {mounted && (
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = theme === opt.value;
                    return (
                      <Button
                        key={opt.value}
                        variant={isActive ? "default" : "outline"}
                        className={`rounded-xl h-20 flex-col gap-2 ${
                          isActive
                            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0"
                            : "border-zinc-200 dark:border-zinc-700"
                        }`}
                        onClick={() => handleThemeChange(opt.value)}
                      >
                        <Icon className="size-5" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Bell className="size-4 text-white" />
              </div>
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates about your account via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Inquiry Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified when someone inquires about your listing</p>
              </div>
              <Switch checked={inquiryAlerts} onCheckedChange={setInquiryAlerts} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Marketing Emails</Label>
                <p className="text-xs text-muted-foreground">Receive promotional offers and market updates</p>
              </div>
              <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
                <Shield className="size-4 text-white" />
              </div>
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Account created: {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full rounded-xl justify-start gap-2 border-zinc-200 dark:border-zinc-700"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>

            <Separator />

            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="w-full rounded-xl justify-start gap-2 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="size-4" />
                Delete Account
              </Button>
            ) : (
              <div className="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 space-y-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Are you sure? This action cannot be undone.
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80">
                  All your listings, favorites, and profile data will be permanently deleted.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteAccount}
                  >
                    Yes, Delete My Account
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
