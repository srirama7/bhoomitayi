"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { BuyTokensDialog } from "@/components/tokens/buy-tokens-dialog";

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
  const [buyTokensOpen, setBuyTokensOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      // Clear store immediately so NativeAuthGuard redirects right away
      // (don't wait for Firebase onAuthStateChanged — it's too slow on Android WebView)
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setProfile(null);
      // Navigate first so UI doesn't hang
      router.replace("/auth/login");
      // Then sign out from Firebase in background
      await signOut(auth);
    } catch {
      // Even if signOut fails, we've already cleared local state and redirected
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setProfile(null);
      router.replace("/auth/login");
    }
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
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
        className={`sticky top-0 z-50 w-full transition-all duration-500 pt-[env(safe-area-inset-top,0px)] flex flex-col ${
          scrolled
            ? "bg-white/50 dark:bg-zinc-950/50 backdrop-blur-3xl shadow-sm shadow-black/[0.02] dark:shadow-black/20 border-b border-zinc-200/50 dark:border-white/[0.05]"
            : "bg-white/20 dark:bg-zinc-950/20 backdrop-blur-2xl border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-full items-center justify-between px-2 sm:px-4 lg:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-all hover:opacity-90"
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className="relative flex items-center justify-center size-14 rounded-full shadow-md overflow-hidden"
          >
            <Image src="/logo-v2.png" alt="BhoomiTayi Logo" width={56} height={56} className="object-cover w-full h-full rounded-full" priority />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent font-extrabold tracking-tight leading-none">
              BhoomiTayi
            </span>
            <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
              by ayushree herbals
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav id="nav-categories" className="hidden items-center gap-1 md:flex">
          {CATEGORIES.map((cat) => (
            <Link key={cat.value} href={cat.href} className="relative group px-1">
              <Button
                variant="ghost"
                size="sm"
                className="relative z-10 gap-1.5 rounded-full hover:bg-transparent transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium"
              >
                {categoryIcons[cat.value]}
                {t(categoryI18nKeys[cat.value])}
              </Button>
              {/* Premium hover pill background */}
              <div className="absolute inset-0 z-0 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full scale-50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
            </Link>
          ))}
          <Button
            id="nav-register-service"
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
          
          <div id="language-selector-desktop" className="ml-2">
            <LanguageSelector variant="desktop" />
          </div>
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-2.5 md:flex">
          {/* BhoomiTayi Token Balance Button */}
          {user && profile && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setBuyTokensOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 shadow-sm hover:shadow transition-all text-xs font-black cursor-pointer"
              title="Click to view BhoomiTayi Token wallet & buy tokens"
            >
              <Image
                src="/token_icon.png"
                alt="Tokens"
                width={20}
                height={20}
                className="rounded-full shrink-0"
              />
              <span className="text-sm font-black">{profile.tokens ?? 0}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight">
                Tokens
              </span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </motion.button>
          )}

          {/* Social Icons inside Navbar */}
          <div className="flex items-center gap-3 px-2 border-r border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
            <a href="https://www.instagram.com/bhoomitayi7" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 dark:hover:text-pink-400 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.facebook.com/share/19Ht8mJf4u/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-500 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
            </a>
            <a href="https://youtube.com/@bhoomitayi7?si=KWM9l_VAawUDaNQb" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors mr-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>

          <div id="theme-toggle-desktop">
            <ThemeToggle />
          </div>

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
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Token Wallet Row in Menu */}
                <div className="mx-2 my-1 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image src="/token_icon.png" alt="Token" width={20} height={20} className="rounded-full" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">BhoomiTayi Tokens</p>
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">{profile.tokens ?? 0} Available</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-bold px-2 rounded-lg bg-emerald-600 text-white border-0 hover:bg-emerald-700 shadow-sm"
                    onClick={() => setBuyTokensOpen(true)}
                  >
                    + Buy
                  </Button>
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
            <div id="nav-auth-buttons" className="flex items-center gap-2">
              <Link href="/auth/login" id="nav-login">
                <Button variant="ghost" size="sm" className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/auth/signup" id="nav-signup">
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
        <div className="flex items-center gap-2 md:hidden pr-3 sm:pr-0">
          {/* Mobile Token Button */}
          {user && profile && (
            <button
              onClick={() => setBuyTokensOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-black shadow-sm cursor-pointer"
            >
              <Image
                src="/token_icon.png"
                alt="Tokens"
                width={18}
                height={18}
                className="rounded-full shrink-0"
              />
              <span>{profile.tokens ?? 0}</span>
            </button>
          )}

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
                    className="flex items-center gap-3 transition-all hover:opacity-90"
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className="flex items-center justify-center size-14 rounded-full shadow-md overflow-hidden">
                      <Image src="/logo-v2.png" alt="BhoomiTayi Logo" width={56} height={56} className="object-cover w-full h-full rounded-full" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold leading-none">
                        BhoomiTayi
                      </span>
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                        by ayushree herbals
                      </span>
                    </div>
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
                        <p className="text-xs text-muted-foreground truncate max-w-[170px]">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Mobile BhoomiTayi Token Wallet Card */}
                    <div className="mb-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 dark:border-emerald-700/60 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Image src="/token_icon.png" alt="Token" width={22} height={22} className="rounded-full" />
                          <span className="text-xs font-black text-foreground">BhoomiTayi Tokens</span>
                        </div>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          🪙 {profile.tokens ?? 0}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full h-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm"
                        onClick={() => {
                          setMobileOpen(false);
                          setBuyTokensOpen(true);
                        }}
                      >
                        + Buy More Tokens (from ₹49)
                      </Button>
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

      {/* Buy Tokens Dialog Modal */}
      <BuyTokensDialog
        open={buyTokensOpen}
        onOpenChange={setBuyTokensOpen}
      />
    </motion.header>
    </>
  );
}
