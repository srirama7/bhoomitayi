"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Home,
  Menu,
  User,
  LogOut,
  Heart,
  List,
  Settings,
  Building2,
  Mountain,
  Bed,
  Car,
  Package,
  Sun,
  Moon,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";

import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/firebase/config";
import { CATEGORIES } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSelector } from "@/components/layout/language-selector";

const categoryIcons: Record<string, React.ReactNode> = {
  house: <Home className="size-4" />,
  land: <Mountain className="size-4" />,
  pg: <Bed className="size-4" />,
  commercial: <Building2 className="size-4" />,
  vehicle: <Car className="size-4" />,
  commodity: <Package className="size-4" />,
};

const categoryI18nKeys: Record<string, string> = {
  house: "nav.houses",
  land: "nav.land",
  pg: "nav.pg",
  commercial: "nav.commercial",
  vehicle: "nav.vehicles",
  commodity: "nav.commodities",
};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9 rounded-xl" disabled>
        <Sun className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="size-9 rounded-xl relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ y: 10, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -10, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="size-4 text-blue-400" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ y: 10, opacity: 0, rotate: 90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -10, opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="size-4 text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.div>
  );
}

export function Navbar() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setProfile(null);
    router.push("/");
    router.refresh();
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-lg shadow-black/[0.03] dark:shadow-black/20 border-b border-zinc-200/60 dark:border-white/[0.06]"
          : "bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-xl text-primary group"
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className="relative flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25"
          >
            <Home className="size-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300" />
          </motion.div>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent font-extrabold tracking-tight">
            BhoomiTayi
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {CATEGORIES.map((cat) => (
            <Link key={cat.value} href={cat.href}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {categoryIcons[cat.value]}
                {t(categoryI18nKeys[cat.value])}
              </Button>
            </Link>
          ))}
          <Button
            size="sm"
            className="gap-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-600/20 hover:shadow-green-600/30 transition-all duration-200 font-semibold"
            onClick={() => {
              if (user) {
                router.push("/sell");
              } else {
                router.push("/auth/login?redirectTo=/sell");
              }
            }}
          >
            <Plus className="size-4" />
            {t("nav.register_service")}
          </Button>
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSelector variant="desktop" />
          <ThemeToggle />

          {user && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative size-10 rounded-full ring-2 ring-blue-100 dark:ring-blue-900/50 hover:ring-blue-300 dark:hover:ring-blue-700 transition-all duration-200"
                >
                  <Avatar>
                    {profile.avatar_url && (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={profile.full_name}
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-zinc-200 dark:border-zinc-700/50 backdrop-blur-xl">
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-semibold">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")} className="rounded-lg mx-1">
                  <Settings className="mr-2 size-4" />
                  {t("nav.dashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/my-listings")} className="rounded-lg mx-1">
                  <List className="mr-2 size-4" />
                  {t("nav.my_listings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/favorites")} className="rounded-lg mx-1">
                  <Heart className="mr-2 size-4" />
                  {t("nav.favorites")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="rounded-lg mx-1">
                  <User className="mr-2 size-4" />
                  {t("nav.profile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg mx-1 text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 size-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="sm"
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all"
                  >
                    {t("nav.signup")}
                  </Button>
                </motion.div>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0 overflow-y-auto">
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle>
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-lg"
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                      <Home className="size-4 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">
                      BhoomiTayi
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Language Selector */}
              <div className="border-b p-4">
                <LanguageSelector variant="mobile" />
              </div>

              <div className="flex flex-col gap-1 p-4">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("nav.browse")}
                </p>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value}
                    href={cat.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 rounded-xl"
                    >
                      {categoryIcons[cat.value]}
                      {t(categoryI18nKeys[cat.value])}
                    </Button>
                  </Link>
                ))}
                <p className="mt-4 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("nav.for_providers")}
                </p>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 rounded-xl text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40"
                  onClick={() => {
                    setMobileOpen(false);
                    if (user) {
                      router.push("/sell");
                    } else {
                      router.push("/auth/login?redirectTo=/sell");
                    }
                  }}
                >
                  <Plus className="size-4" />
                  {t("nav.register_service")}
                </Button>
              </div>

              <div className="border-t p-4">
                {user && profile ? (
                  <div className="flex flex-col gap-1">
                    <div className="mb-3 flex items-center gap-3 px-2">
                      <Avatar>
                        {profile.avatar_url && (
                          <AvatarImage
                            src={profile.avatar_url}
                            alt={profile.full_name}
                          />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">
                          {profile.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 rounded-xl"
                      >
                        <Settings className="size-4" />
                        {t("nav.dashboard")}
                      </Button>
                    </Link>
                    <Link
                      href="/dashboard/my-listings"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 rounded-xl"
                      >
                        <List className="size-4" />
                        {t("nav.my_listings")}
                      </Button>
                    </Link>
                    <Link
                      href="/dashboard/favorites"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 rounded-xl"
                      >
                        <Heart className="size-4" />
                        {t("nav.favorites")}
                      </Button>
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 rounded-xl"
                      >
                        <User className="size-4" />
                        {t("nav.profile")}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 rounded-xl text-destructive hover:text-destructive"
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="size-4" />
                      {t("nav.logout")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button variant="outline" className="w-full rounded-xl">
                        {t("nav.login")}
                      </Button>
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        {t("nav.signup")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
