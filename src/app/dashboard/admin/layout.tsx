"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  Building,
  Settings,
  LogOut,
  Home,
  Bell,
  Search,
  ChevronDown,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

const adminNavItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "User Management", href: "/dashboard/admin/users", icon: Users },
  { label: "Listings Control", href: "/dashboard/admin/listings", icon: Building },
  { label: "System Reports", href: "/dashboard/admin/reports", icon: Shield },
  { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return pathname === "/dashboard/admin";
    }
    return pathname.startsWith(href);
  };

  if (loading) return null;

  if (!user || profile?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-red-100 text-red-600 mb-2">
            <Shield className="size-8" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Access Denied</h1>
          <p className="text-zinc-500">This area is reserved for system administrators. Please log in with an authorized account.</p>
          <Button className="w-full bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" asChild>
            <Link href="/auth/login">Return to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-zinc-900 text-zinc-400 transition-all duration-300 border-r border-zinc-800",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-zinc-800">
          <Link href="/dashboard/admin" className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Shield className="size-5" />
            </div>
            {isSidebarOpen && <span className="font-black text-white tracking-tight uppercase">Admin Console</span>}
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  active 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "hover:bg-zinc-800 hover:text-zinc-100"
                )}
              >
                <Icon className={cn("size-5 shrink-0", active ? "text-white" : "text-zinc-500 group-hover:text-zinc-100")} />
                {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4">
           <Button variant="ghost" className="w-full justify-start gap-3 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl" asChild>
             <Link href="/">
               <LogOut className="size-5 shrink-0" />
               {isSidebarOpen && <span className="font-bold text-sm">Exit Admin</span>}
             </Link>
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300",
          isSidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-500">
              <Menu className="size-5" />
            </Button>
            <div className="relative hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
               <input 
                 type="text" 
                 placeholder="Quick search..." 
                 className="pl-10 h-9 w-64 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-sm focus:ring-2 focus:ring-blue-500"
               />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-zinc-500">
               <Bell className="size-5" />
               <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-1 pr-2 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-2">
                  <Avatar className="size-8 border border-zinc-200 dark:border-zinc-700">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold">
                      {profile?.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-none">{profile?.full_name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Super Admin</p>
                  </div>
                  <ChevronDown className="size-3.5 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Support Access</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 font-bold">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
