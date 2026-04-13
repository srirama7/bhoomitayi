"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Heart,
  MessageSquare,
  User,
  Home,
  ArrowLeft,
  Loader2,
  Bot,
  Settings,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

const baseNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Listings", href: "/dashboard/my-listings", icon: List },
  { label: "Favorites", href: "/dashboard/favorites", icon: Heart },
  { label: "Inquiries", href: "/dashboard/inquiries", icon: MessageSquare },
  { label: "Tommy AI", href: "/dashboard/tommy", icon: Bot },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavItems = [
  { label: "Admin Listings", href: "/dashboard/admin/listings", icon: Shield },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuthStore();
  const [redirecting, setRedirecting] = useState(false);
  const navItems =
    profile?.role === "admin"
      ? [...baseNavItems, ...adminNavItems]
      : baseNavItems;

  useEffect(() => {
    if (!loading && !user) {
      setRedirecting(true);
      router.push(`/auth/login?redirectTo=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Please sign in to access your dashboard</p>
          <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed top-0 left-0 z-30 hidden h-screen w-64 border-r bg-background md:block">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Home className="size-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">
              BhoomiTayi
            </span>
          </Link>
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Button
                key={item.href}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-3 h-10",
                  active && "font-semibold"
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t bg-background py-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors",
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="md:ml-64">
        <div className="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
