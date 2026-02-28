"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Users, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Listings", href: "/admin/listings", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "admin")) {
      router.push("/");
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return null;
  }

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="bg-card fixed top-0 left-0 z-40 flex h-full w-64 flex-col border-r">
        {/* Admin Header */}
        <div className="flex items-center gap-3 border-b px-6 py-5">
          <ShieldAlert className="size-6 text-red-500" />
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold">PropNest</span>
            <Badge className="bg-red-500 text-white hover:bg-red-600">
              Admin Panel
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t px-3 py-4">
          <div className="text-muted-foreground mb-3 truncate px-4 text-xs">
            {profile.full_name}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
