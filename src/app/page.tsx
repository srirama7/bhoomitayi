"use client";

import Link from "next/link";
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
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/home/search-bar";
import { HeroParticles } from "@/components/home/hero-particles";
import { TiltCard } from "@/components/home/tilt-card";
import { AnimatedCounter } from "@/components/home/animated-counter";
import { CATEGORIES } from "@/lib/constants";
import { getFeaturedListings } from "@/lib/queries";
import { ListingCard } from "@/components/listings/listing-card";
import type { Listing } from "@/lib/types/database";

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
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    getFeaturedListings().then(setListings).finally(() => setLoadingListings(false));
  }, []);

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-blue-900 dark:via-indigo-950 dark:to-purple-950 animate-gradient noise-overlay">
        <HeroParticles />

        {/* Aurora glow orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-400/15 dark:bg-blue-400/10 blur-3xl animate-aurora animate-morph" />
          <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-400/15 dark:bg-purple-400/10 blur-3xl animate-aurora-delayed animate-morph" />
          <div className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-indigo-400/10 blur-2xl animate-aurora-slow" />
          <div className="absolute top-1/2 right-1/4 h-48 w-48 rounded-full bg-pink-400/10 blur-2xl animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28 sm:py-36 lg:py-48">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white/90 backdrop-blur-md border border-white/20 animate-pulse-glow"
            >
              <Sparkles className="size-4 text-yellow-300" />
              {t("hero.badge")}
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white tracking-tight leading-[1.05]"
              >
                {t("hero.title_line1")}
                <br />
                <motion.span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 animate-text-gradient"
                  style={{ backgroundSize: "200% auto" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  {t("hero.title_line2")}
                </motion.span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mx-auto max-w-2xl text-lg sm:text-xl text-blue-100/80 leading-relaxed"
              >
                {t("hero.subtitle")}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="pt-4"
            >
              <SearchBar />
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 120V60C120 20 240 0 360 10C480 20 600 60 720 70C840 80 960 60 1080 40C1200 20 1320 10 1380 5L1440 0V120H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Category Cards Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <Link href={cat.href} className="group block">
                  <TiltCard className="relative">
                    <Card className={`h-full border border-zinc-200/80 dark:border-zinc-800/80 ${style.borderHover} shadow-3d transition-all duration-500 hover:shadow-2xl ${style.glowColor} overflow-hidden bg-white dark:bg-zinc-900/80 backdrop-blur-sm`}>
                      <div className={`h-1 bg-gradient-to-r ${style.gradient} transition-all duration-500 group-hover:h-1.5`} />
                      <CardContent className="pt-6 pb-6 space-y-4">
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          className={`relative inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br ${style.gradient} shadow-lg`}
                        >
                          <Icon className="size-8 text-white" />
                        </motion.div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl" role="img" aria-label={cat.label}>{cat.emoji}</span>
                            <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                              {t(NAV_KEYS[i])}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {t(CATEGORY_DESC_KEYS[i])}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {t("categories.browse")} {t(NAV_KEYS[i])}
                          <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-3xl mb-12">
        <AnimatedSection>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 px-4">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Featured <span className="text-blue-600">Services</span>
              </h2>
              <p className="text-muted-foreground">
                Hand-picked listings with active visibility timers.
              </p>
            </div>
            <Button variant="ghost" className="group text-blue-600" asChild>
              <Link href="/houses">
                View all services
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
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
      </section>

      {/* How It Works Section */}
      <section className="relative bg-zinc-50/80 dark:bg-zinc-950/50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-80 w-80 rounded-full bg-blue-200/30 dark:bg-blue-900/15 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-purple-200/30 dark:bg-purple-900/15 blur-3xl animate-float-delayed" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {t("how_it_works.title_prefix")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {t("how_it_works.title_highlight")}
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground text-lg">
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
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-blue-800 dark:via-indigo-900 dark:to-purple-950 p-10 sm:p-16 shadow-2xl overflow-hidden noise-overlay"
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl animate-aurora" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl animate-aurora-delayed" />
            <div className="absolute inset-0 animate-shimmer" />
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            {[
              { value: "10,000+", label: t("stats.services"), Icon: Building },
              { value: "500+", label: t("stats.cities"), Icon: MapPin },
              { value: "50,000+", label: t("stats.users"), Icon: Users },
            ].map((stat, i) => (
              <AnimatedCounter
                key={stat.label}
                target={stat.value}
                label={stat.label}
                icon={<stat.Icon className="size-8 text-white/90" />}
                delay={i * 200}
              />
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
