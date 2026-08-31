"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mountain, Bed, Building2, Car, Package } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  borderHover: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Houses",
    href: "/houses",
    icon: Home,
    gradient: "from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500",
    borderHover: "border-blue-500/40",
  },
  {
    name: "Land",
    href: "/land",
    icon: Mountain,
    gradient: "from-emerald-600 to-green-600 dark:from-emerald-500 dark:to-green-500",
    borderHover: "border-emerald-500/40",
  },
  {
    name: "PG",
    href: "/pg",
    icon: Bed,
    gradient: "from-purple-600 to-violet-600 dark:from-purple-500 dark:to-violet-500",
    borderHover: "border-purple-500/40",
  },
  {
    name: "Commercial",
    href: "/commercial",
    icon: Building2,
    gradient: "from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500",
    borderHover: "border-amber-500/40",
  },
  {
    name: "Vehicles",
    href: "/vehicles",
    icon: Car,
    gradient: "from-red-600 to-rose-600 dark:from-red-500 dark:to-rose-500",
    borderHover: "border-red-500/40",
  },
  {
    name: "Commodities",
    href: "/commodities",
    icon: Package,
    gradient: "from-cyan-600 to-teal-600 dark:from-cyan-500 dark:to-teal-500",
    borderHover: "border-cyan-500/40",
  },
];

export function LeftNavigationSidebar() {
  const pathname = usePathname();

  // Hide on dashboard or admin pages
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <div
      id="quick-nav-left-bar"
      className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1 sm:gap-1.5 items-start pointer-events-auto select-none"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.name}
            className={`group flex flex-col items-center gap-0.5 py-1 px-0.5 sm:py-2 sm:px-1.5 rounded-r-md sm:rounded-r-xl shadow-md transition-all duration-300 hover:pl-1.5 cursor-pointer border-r border-y ${item.borderHover} ${
              isActive
                ? "bg-gradient-to-r " + item.gradient + " text-white ring-2 ring-white/30 scale-105"
                : "bg-white/95 dark:bg-zinc-900/95 hover:bg-gradient-to-r hover:" + item.gradient + " text-zinc-700 dark:text-zinc-300 hover:text-white backdrop-blur-md"
            }`}
            style={{ writingMode: "vertical-lr" }}
          >
            <span className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider">
              <Icon className="size-2 sm:size-3 rotate-90 shrink-0" />
              <span>{item.name}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
