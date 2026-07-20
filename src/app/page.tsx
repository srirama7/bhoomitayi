"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  Search,
  Home,
  Mountain,
  Bed,
  Building2,
  Car,
  Package,
  ArrowRight,
  Users,
  Building,
  Sparkles,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/home/search-bar";
import { HeroParticles } from "@/components/home/hero-particles";
import { TiltCard } from "@/components/home/tilt-card";
import { AnimatedCounter } from "@/components/home/animated-counter";
import { CATEGORIES } from "@/lib/constants";
import { getFeaturedListings } from "@/lib/queries";
import { useAuthStore } from "@/lib/store";
import { ListingCard } from "@/components/listings/listing-card";
import { RecentlyViewed } from "@/components/listings/recently-viewed";
import type { Listing } from "@/lib/types/database";
import { isNativeApp } from "@/lib/firebase/native-auth";

const CATEGORY_ICONS = [Home, Mountain, Bed, Building2, Car, Package];
const CATEGORY_DESC_KEYS = [
  "categories.house_desc",
  "categories.land_desc",
  "categories.pg_desc",
  "categories.commercial_desc",
  "categories.vehicle_desc",
  "categories.commodity_desc",
];
const CATEGORY_STYLES = [
  { gradient: "from-blue-500 via-blue-600 to-indigo-600", bgLight: "bg-blue-50 dark:bg-blue-950/30", borderHover: "hover:border-blue-300 dark:hover:border-blue-700", glowColor: "group-hover:shadow-blue-500/10 dark:group-hover:shadow-blue-500/20" },
  { gradient: "from-emerald-500 via-green-500 to-teal-600", bgLight: "bg-green-50 dark:bg-green-950/30", borderHover: "hover:border-green-300 dark:hover:border-green-700", glowColor: "group-hover:shadow-emerald-500/10 dark:group-hover:shadow-emerald-500/20" },
  { gradient: "from-violet-500 via-purple-500 to-fuchsia-600", bgLight: "bg-purple-50 dark:bg-purple-950/30", borderHover: "hover:border-purple-300 dark:hover:border-purple-700", glowColor: "group-hover:shadow-violet-500/10 dark:group-hover:shadow-violet-500/20" },
  { gradient: "from-amber-500 via-orange-500 to-red-500", bgLight: "bg-orange-50 dark:bg-orange-950/30", borderHover: "hover:border-orange-300 dark:hover:border-orange-700", glowColor: "group-hover:shadow-orange-500/10 dark:group-hover:shadow-orange-500/20" },
  { gradient: "from-red-500 via-rose-500 to-pink-600", bgLight: "bg-red-50 dark:bg-red-950/30", borderHover: "hover:border-red-300 dark:hover:border-red-700", glowColor: "group-hover:shadow-red-500/10 dark:group-hover:shadow-red-500/20" },
  { gradient: "from-cyan-500 via-teal-500 to-emerald-600", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", borderHover: "hover:border-cyan-300 dark:hover:border-cyan-700", glowColor: "group-hover:shadow-cyan-500/10 dark:group-hover:shadow-cyan-500/20" },
];

const NAV_KEYS = ["nav.houses", "nav.land", "nav.pg", "nav.commercial", "nav.vehicles", "nav.commodities"];

const HOW_IT_WORKS_ICONS = [Search, Users, Home];
const HOW_IT_WORKS_KEYS = [
  { title: "how_it_works.search_title", desc: "how_it_works.search_desc" },
  { title: "how_it_works.connect_title", desc: "how_it_works.connect_desc" },
  { title: "how_it_works.get_started_title", desc: "how_it_works.get_started_desc" },
];
const HOW_IT_WORKS_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
];

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [isNative, setIsNative] = useState(false);

  // Hero animation states
  const [heroIndex, setHeroIndex] = useState(0);

  const heroWords = [
    "Space",
    "Home",
    "Vehicle",
    "Houses",
    "PGs",
    "Commercial",
    "Other Commodities",
    "Land",
    "Vehicles"
  ];
  const heroSubtitles = [
    "India's trusted online marketplace — list what you offer, buy, sell & rent",
    "Zero Mediators, Zero Commission — Keep 100% of your profits.",
    "Free Viewing for Everyone — Browse all listings without hidden charges.",
    "Find your perfect house without any brokerage.",
    "Comfortable PGs and Hostels for students and professionals.",
    "Commercial spaces for your growing business needs.",
    "Buy and sell other commodities directly with owners.",
    "Invest in land and plots with zero commission.",
    "Direct communication between buyers and sellers for vehicles."
  ];

  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  useEffect(() => {
    if (isNative) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroWords.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isNative]);

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") {
      router.push("/dashboard/admin");
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    getFeaturedListings().then(setListings).finally(() => setLoadingListings(false));
  }, []);

  return (
    <main className="min-h-screen overflow-hidden relative selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-900/50 dark:selection:text-blue-100">
      {/* Global Ambient Background to remove all flat white/dark spaces */}
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
        <div className="absolute inset-0 bg-indigo-50/30 dark:bg-zinc-950 transition-colors duration-1000" />
        
        {/* Massive Ambient Glows */}
        <div className="absolute top-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-300/20 dark:from-blue-600/30 dark:to-cyan-400/30 blur-[150px] animate-aurora mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-r from-purple-400/20 to-pink-300/20 dark:from-purple-600/30 dark:to-pink-500/30 blur-[150px] animate-aurora-delayed mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[30%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-r from-indigo-400/20 to-blue-300/20 dark:from-indigo-600/20 dark:to-blue-500/20 blur-[150px] animate-aurora-slow mix-blend-multiply dark:mix-blend-screen" />
        
        {/* Intense Neon Lights specifically for dark mode/black parts */}
        <div className="absolute top-[20%] right-[10%] w-[20vw] h-[20vw] rounded-full bg-pink-500/0 dark:bg-pink-500/40 blur-[80px] animate-float mix-blend-screen" />
        <div className="absolute bottom-[30%] left-[15%] w-[15vw] h-[15vw] rounded-full bg-lime-500/0 dark:bg-lime-500/40 blur-[80px] animate-float-delayed mix-blend-screen" />
        <div className="absolute top-[60%] right-[30%] w-[25vw] h-[25vw] rounded-full bg-amber-500/0 dark:bg-amber-500/30 blur-[90px] animate-aurora mix-blend-screen" style={{ animationDelay: '3s' }} />
        
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] dark:opacity-[0.06] mix-blend-overlay" />
      </div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-blue-900 dark:via-indigo-950 dark:to-purple-950 noise-overlay">
        {!isNative && <HeroParticles />}

        {/* Aurora glow orbs */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Vibrant Aurora glow orbs */}
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-blue-400/30 to-purple-500/30 blur-[100px] animate-aurora animate-morph" />
          <div className="absolute -bottom-40 -left-40 h-[700px] w-[700px] rounded-full bg-gradient-to-r from-pink-500/20 to-orange-400/20 blur-[120px] animate-aurora-delayed animate-morph" />
          <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-[90px] animate-aurora-slow" />
          <div className="absolute top-1/2 right-1/4 h-80 w-80 rounded-full bg-cyan-400/20 blur-[80px] animate-float-slow" />
          
          {/* Floating Glassmorphism Elements to make UI not dull */}
          <motion.div 
            animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-24 left-10 md:left-32 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hidden md:flex items-center justify-center"
          >
            <Home className="size-8 text-blue-200 drop-shadow-[0_0_15px_rgba(191,219,254,0.8)]" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 40, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-40 right-10 md:right-32 p-5 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hidden md:flex items-center justify-center"
          >
            <Sparkles className="size-10 text-pink-300 drop-shadow-[0_0_15px_rgba(249,168,212,0.8)]" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/3 right-12 md:right-48 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl hidden lg:flex items-center justify-center"
          >
            <Building2 className="size-6 text-purple-200 drop-shadow-[0_0_10px_rgba(233,213,255,0.8)]" />
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28 sm:py-36 lg:py-48">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-3 rounded-full bg-white/10 pl-2 pr-5 py-2 text-sm font-medium text-white/90 backdrop-blur-md border border-white/20 animate-pulse-glow"
            >
              <div className="flex items-center justify-center size-14 rounded-full shadow-md overflow-hidden">
                <Image src="/logo-v2.png" alt="BhoomiTayi Logo" width={56} height={56} className="object-cover w-full h-full rounded-full" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-white tracking-wide text-lg leading-none">BhoomiTayi</span>
                <span className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold mt-0.5">by ayushree herbals</span>
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-5xl sm:text-7xl lg:text-[5.5rem] font-extrabold text-white tracking-tighter leading-[1.05] filter drop-shadow-sm"
              >
                {t("hero.title_line1")}
                <br />
                <div className="h-[1.2em] relative overflow-visible flex justify-center">
                  {isNative ? (
                    <span
                      className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 animate-text-gradient inline-block"
                      style={{ backgroundSize: "200% auto" }}
                    >
                      {t("hero.title_line2")}
                    </span>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={heroIndex}
                        className="absolute text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 animate-text-gradient inline-block"
                        style={{ backgroundSize: "200% auto" }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      >
                        {heroWords[heroIndex]}
                      </motion.span>
                    </AnimatePresence>
                  )}
                </div>
              </motion.h1>
              <div className="h-[4.5rem] sm:h-[3.5rem] relative flex justify-center">
                {isNative ? (
                  <p className="mx-auto max-w-2xl text-lg sm:text-xl text-blue-100/80 leading-relaxed text-center">
                    {t("hero.subtitle")}
                  </p>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={heroIndex}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute mx-auto max-w-2xl text-lg sm:text-xl text-blue-100/80 leading-relaxed text-center"
                    >
                      {heroSubtitles[heroIndex]}
                    </motion.p>
                  </AnimatePresence>
                )}
              </div>
            </div>

            <motion.div
              id="hero-search-area"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.4 }}
              className="pt-8 max-w-4xl mx-auto"
            >
              <div className="p-3 rounded-[2rem] bg-white/10 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/20 ring-1 ring-white/10">
                <SearchBar />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Removed static SVG curve to let the vibrant global background flow seamlessly */}
      </section>

      <RecentlyViewed />

      {/* Category Cards Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 z-10">
        <AnimatedSection>
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {t("categories.explore_by")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                {t("categories.category")}
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              {t("categories.subtitle")}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, i) => {
            const Icon = CATEGORY_ICONS[i];
            const style = CATEGORY_STYLES[i];
            return (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, type: "spring", bounce: 0.4 }}
              >
                <Link href={cat.href} className="group block h-full">
                  <TiltCard className="relative h-full">
                    <Card className={`relative h-full border border-zinc-200/50 dark:border-zinc-800/50 ${style.borderHover} transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${style.glowColor} overflow-hidden bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950/50 backdrop-blur-xl`}>
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.gradient} opacity-70 transition-all duration-500 group-hover:opacity-100 group-hover:h-1.5`} />
                      
                      {/* Subtle background glow on hover */}
                      <div className={`absolute -inset-24 rounded-full bg-gradient-to-br ${style.gradient} opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-5 dark:group-hover:opacity-10`} />

                      <CardContent className="relative pt-8 pb-8 px-6 space-y-6">
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className={`relative inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br ${style.gradient} shadow-lg ring-4 ring-white dark:ring-zinc-950 group-hover:shadow-xl transition-all duration-300`}
                        >
                          <Icon className="size-8 text-white" />
                        </motion.div>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110" role="img" aria-label={cat.label}>{cat.emoji}</span>
                            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 dark:group-hover:from-blue-400 dark:group-hover:to-indigo-400 transition-all duration-300">
                              {t(NAV_KEYS[i])}
                            </h3>
                          </div>
                          <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                            {t(CATEGORY_DESC_KEYS[i])}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center gap-2 text-sm font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          {t("categories.browse")} {t(NAV_KEYS[i])}
                          <ArrowRight className="size-4 transition-all duration-300 group-hover:translate-x-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </TiltCard>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured Listings Section */}
      <section id="featured-listings" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 mb-16 overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/60 dark:via-indigo-900/60 dark:to-purple-900/60 shadow-inner">
        {/* Dynamic Background Overlays */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-3xl" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-400/30 blur-[100px] rounded-full animate-float" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/20 dark:bg-purple-400/30 blur-[100px] rounded-full animate-float-delayed" />
        
        <div className="relative z-10">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-4">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold tracking-widest uppercase mb-2 border border-blue-200 dark:border-blue-800 backdrop-blur-md">
                  <Sparkles className="size-4" />
                  Premium Selection
                </div>
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                  Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Services</span>
                </h2>
                <p className="text-lg text-muted-foreground font-medium max-w-2xl">
                  Hand-picked listings with active visibility timers and verified sellers.
                </p>
              </div>
              <Button size="lg" className="group bg-white dark:bg-zinc-900 text-foreground border border-zinc-200 dark:border-zinc-800 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-full" asChild>
                <Link href="/houses">
                  <span className="font-bold">View all services</span>
                  <div className="ml-2 flex items-center justify-center size-8 rounded-full bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors">
                    <ArrowRight className="size-4 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </Button>
            </div>
          </AnimatedSection>

        {loadingListings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {listings.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <ListingCard listing={l} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active listings available at the moment.</p>
          </div>
        )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-bl from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900/60 dark:via-pink-900/60 dark:to-orange-900/60">
        {/* Dynamic sweeping background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-full h-[800px] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-[120px] animate-morph" />
          <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-blue-500/30 to-cyan-500/30 blur-[120px] animate-morph" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-6 mb-24">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold tracking-widest uppercase border border-purple-200 dark:border-purple-800 backdrop-blur-md">
                <Sparkles className="size-4" />
                Simple Process
              </div>
              <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground">
                {t("how_it_works.title_prefix")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
                  {t("how_it_works.title_highlight")}
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground text-xl font-medium">
                {t("how_it_works.subtitle")}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {HOW_IT_WORKS_KEYS.map((item, index) => {
              const Icon = HOW_IT_WORKS_ICONS[index];
              const gradient = HOW_IT_WORKS_GRADIENTS[index];
              const step = String(index + 1).padStart(2, "0");
              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative text-center"
                >
                  {index < HOW_IT_WORKS_KEYS.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px]">
                      <div className="h-full bg-gradient-to-r from-zinc-300 to-transparent dark:from-zinc-700 rounded-full" />
                      <motion.div
                        className={`h-full bg-gradient-to-r ${gradient} rounded-full absolute top-0 left-0`}
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.3 }}
                      />
                    </div>
                  )}
                  <div className="relative inline-flex flex-col items-center gap-5">
                    <motion.div
                      whileHover={{ scale: 1.1, rotateY: 15 }}
                      className={`relative flex items-center justify-center size-24 rounded-3xl bg-gradient-to-br ${gradient} shadow-xl`}
                      style={{ transformStyle: "preserve-3d", perspective: 800 }}
                    >
                      <Icon className="size-10 text-white" />
                    </motion.div>
                    <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                      {t("how_it_works.step")} {step}
                    </span>
                  </div>
                  <div className="space-y-3 mt-6">
                    <h3 className="text-2xl font-bold text-foreground">{t(item.title)}</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">{t(item.desc)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative rounded-[3rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-10 sm:p-20 shadow-2xl overflow-hidden"
        >
          {/* Intense neon glows inside the vibrant stats card */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-[100px] animate-aurora" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-400/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-[100px] animate-aurora-delayed" />
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-400/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[80px]" />
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { value: "10,000+", label: t("stats.services"), Icon: Building },
              { value: "500+", label: t("stats.cities"), Icon: MapPin },
              { value: "50,000+", label: t("stats.users"), Icon: Users },
            ].map((stat, i) => (
              <div key={stat.label} className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-md border border-white/20 shadow-xl">
                <AnimatedCounter
                  target={stat.value}
                  label={stat.label}
                  icon={<stat.Icon className="size-10 text-white drop-shadow-md mb-2 group-hover:scale-110 transition-transform duration-300" />}
                  delay={i * 200}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-zinc-50/80 dark:bg-zinc-950/50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <AnimatedSection>
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                  {t("cta.ready_to_list")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    {t("cta.service")}
                  </span>
                </h2>
                <p className="mx-auto max-w-xl text-muted-foreground text-lg leading-relaxed">
                  {t("cta.subtitle")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    size="lg"
                    className="h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-xl shadow-blue-600/25 transition-all hover:shadow-2xl hover:shadow-blue-600/40 text-base"
                  >
                    <Link href="/sell">
                      <Sparkles className="size-5" />
                      {t("cta.register")}
                      <ArrowRight className="size-5" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-14 px-10 rounded-2xl font-semibold text-base border-2 border-zinc-300 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all"
                  >
                    <Link href="/houses">{t("cta.browse_services")}</Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
