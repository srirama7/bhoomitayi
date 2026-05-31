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
  { label: "Reports", href: "/dashboard/admin/reports", icon: Shield },
  { label: "System Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") return pathname === "/dashboard/admin";
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Restricted Access</h1>
          <p className="text-zinc-500">Administrator privileges are required to access this console.</p>
          <Button className="w-full bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" asChild>
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex">
      {/* Admin Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-zinc-50 dark:bg-zinc-900/50 transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/dashboard/admin" className="flex items-center gap-2.5">
            <div className="size-7 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shrink-0">
              <Shield className="size-4" />
            </div>
            {isSidebarOpen && <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Admin Console</span>}
          </Link>
        </div>

        <div className="p-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
                  active 
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium" 
                    : "text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-inherit" : "text-zinc-400")} />
                {isSidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-0 right-0 px-4">
           <Button variant="ghost" className="w-full justify-start gap-3 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" asChild>
             <Link href="/">
               <LogOut className="size-4 shrink-0" />
               {isSidebarOpen && <span className="text-sm font-medium">Exit Console</span>}
             </Link>
           </Button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        {/* Top Management Bar */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-400 hover:text-zinc-900">
              <Menu className="size-5" />
            </Button>
            <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 font-medium uppercase tracking-widest">
               <span>Management</span>
               <span>/</span>
               <span className="text-zinc-900 dark:text-zinc-100">{pathname.split('/').pop()?.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative hidden sm:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
               <input 
                 type="text" 
                 placeholder="Search dashboard..." 
                 className="pl-9 h-9 w-48 lg:w-64 rounded-md bg-zinc-100 dark:bg-zinc-900 border-none text-xs focus:ring-1 focus:ring-zinc-400"
               />
            </div>

            <Button variant="ghost" size="icon" className="relative text-zinc-400">
               <Bell className="size-5" />
               <span className="absolute top-2.5 right-2.5 size-1.5 bg-zinc-900 dark:bg-zinc-100 rounded-full border border-white dark:border-zinc-950" />
            </Button>
            
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-2.5">
                  <Avatar className="size-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-zinc-900 text-white text-[10px] font-bold">
                      {profile?.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left pr-1">
                    <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">{profile?.full_name}</p>
                    <p className="text-[9px] text-zinc-400 font-semibold uppercase mt-1 tracking-tighter">Administrator</p>
                  </div>
                  <ChevronDown className="size-3.5 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel className="text-xs uppercase text-zinc-400">Account</DropdownMenuLabel>
                <DropdownMenuItem className="text-xs">Security Settings</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Audit Logs</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-red-600 font-semibold">Terminate Session</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Page Rendering */}
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
