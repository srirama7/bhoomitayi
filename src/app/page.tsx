"use client";

import Link from "next/link";
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
  Zap,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/home/search-bar";
import { HeroParticles } from "@/components/home/hero-particles";
import { TiltCard } from "@/components/home/tilt-card";
import { AnimatedCounter } from "@/components/home/animated-counter";
import { CATEGORIES } from "@/lib/constants";

const CATEGORY_DETAILS = [
  {
    ...CATEGORIES[0],
    description: "Browse apartments, villas, and independent houses for buy, sell, or rent.",
    Icon: Home,
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    shadowColor: "shadow-blue-500/20",
    borderHover: "hover:border-blue-300 dark:hover:border-blue-700",
    glowColor: "group-hover:shadow-blue-500/10 dark:group-hover:shadow-blue-500/20",
  },
  {
    ...CATEGORIES[1],
    description: "Explore residential, commercial, and agricultural land plots.",
    Icon: Mountain,
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    iconColor: "text-green-600 dark:text-green-400",
    shadowColor: "shadow-green-500/20",
    borderHover: "hover:border-green-300 dark:hover:border-green-700",
    glowColor: "group-hover:shadow-emerald-500/10 dark:group-hover:shadow-emerald-500/20",
  },
  {
    ...CATEGORIES[2],
    description: "Discover affordable paying guest accommodations near you.",
    Icon: Bed,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    shadowColor: "shadow-purple-500/20",
    borderHover: "hover:border-purple-300 dark:hover:border-purple-700",
    glowColor: "group-hover:shadow-violet-500/10 dark:group-hover:shadow-violet-500/20",
  },
  {
    ...CATEGORIES[3],
    description: "Office spaces, shops, warehouses, and co-working spaces.",
    Icon: Building2,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    shadowColor: "shadow-orange-500/20",
    borderHover: "hover:border-orange-300 dark:hover:border-orange-700",
    glowColor: "group-hover:shadow-orange-500/10 dark:group-hover:shadow-orange-500/20",
  },
  {
    ...CATEGORIES[4],
    description: "Buy and sell cars, bikes, scooters, trucks, and more.",
    Icon: Car,
    gradient: "from-red-500 via-rose-500 to-pink-600",
    bgLight: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600 dark:text-red-400",
    shadowColor: "shadow-red-500/20",
    borderHover: "hover:border-red-300 dark:hover:border-red-700",
    glowColor: "group-hover:shadow-red-500/10 dark:group-hover:shadow-red-500/20",
  },
  {
    ...CATEGORIES[5],
    description: "Electronics, furniture, appliances, and miscellaneous items.",
    Icon: Package,
    gradient: "from-cyan-500 via-teal-500 to-emerald-600",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    shadowColor: "shadow-cyan-500/20",
    borderHover: "hover:border-cyan-300 dark:hover:border-cyan-700",
    glowColor: "group-hover:shadow-cyan-500/10 dark:group-hover:shadow-cyan-500/20",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Search",
    description: "Browse verified listings across India. Filter by city, category, and budget to find exactly what you need.",
    Icon: Search,
    gradient: "from-blue-500 to-indigo-600",
    color: "blue",
  },
  {
    step: "02",
    title: "Connect",
    description: "Connect directly with verified sellers and service providers. Get details, schedule visits, and negotiate transparent pricing.",
    Icon: Users,
    gradient: "from-violet-500 to-purple-600",
    color: "violet",
  },
  {
    step: "03",
    title: "Get Started",
    description: "Finalize your deal with confidence. We ensure a smooth, secure, and hassle-free experience from start to finish.",
    Icon: Home,
    gradient: "from-pink-500 to-rose-600",
    color: "pink",
  },
];

const STATS = [
  { value: "10,000+", label: "Services", Icon: Building },
  { value: "500+", label: "Cities", Icon: MapPin },
  { value: "50,000+", label: "Users", Icon: Users },
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
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white/90 backdrop-blur-md border border-white/20 animate-pulse-glow"
            >
              <Sparkles className="size-4 text-yellow-300" />
              Trusted by thousands across India
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white tracking-tight leading-[1.05]"
              >
                Find Your Perfect
                <br />
                <motion.span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 animate-text-gradient"
                  style={{ backgroundSize: "200% auto" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  Space
                </motion.span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mx-auto max-w-2xl text-lg sm:text-xl text-blue-100/80 leading-relaxed"
              >
                India&apos;s trusted online marketplace &mdash; discover services, list what you offer, buy, sell &amp; rent
              </motion.p>
            </div>

            {/* Search Bar */}
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

        {/* Smooth wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120V60C120 20 240 0 360 10C480 20 600 60 720 70C840 80 960 60 1080 40C1200 20 1320 10 1380 5L1440 0V120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Category Cards Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <AnimatedSection>
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Explore by{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                Category
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              Explore our consulting services across multiple categories.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORY_DETAILS.map((cat, i) => (
            <motion.div
              key={cat.value}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Link href={cat.href} className="group block">
                <TiltCard className="relative">
                  <Card className={`h-full border border-zinc-200/80 dark:border-zinc-800/80 ${cat.borderHover} shadow-3d transition-all duration-500 hover:shadow-2xl ${cat.glowColor} overflow-hidden bg-white dark:bg-zinc-900/80 backdrop-blur-sm`}>
                    <div className={`h-1 bg-gradient-to-r ${cat.gradient} transition-all duration-500 group-hover:h-1.5`} />
                    <CardContent className="pt-6 pb-6 space-y-4">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className={`relative inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br ${cat.gradient} shadow-lg`}
                      >
                        <cat.Icon className="size-8 text-white" />
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-30 blur-xl -z-10 transition-opacity duration-500`} />
                      </motion.div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl" role="img" aria-label={cat.label}>
                            {cat.emoji}
                          </span>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {cat.label}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Browse {cat.label}
                        <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </TiltCard>
              </Link>
            </motion.div>
          ))}
        </div>
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
                How It{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Works
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground text-lg">
                Getting started with our consulting services is easy.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {HOW_IT_WORKS.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative text-center"
              >
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px]">
                    <div className="h-full bg-gradient-to-r from-zinc-300 to-transparent dark:from-zinc-700 rounded-full" />
                    <motion.div
                      className={`h-full bg-gradient-to-r ${item.gradient} rounded-full absolute top-0 left-0`}
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
                    className={`relative flex items-center justify-center size-24 rounded-3xl bg-gradient-to-br ${item.gradient} shadow-xl`}
                    style={{ transformStyle: "preserve-3d", perspective: 800 }}
                  >
                    <item.Icon className="size-10 text-white" />
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.gradient} opacity-25 blur-xl -z-10`} />
                  </motion.div>
                  <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    Step {item.step}
                  </span>
                </div>

                <div className="space-y-3 mt-6">
                  <h3 className="text-2xl font-bold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
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
            {STATS.map((stat, i) => (
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
                  Ready to list your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    service?
                  </span>
                </h2>
                <p className="mx-auto max-w-xl text-muted-foreground text-lg leading-relaxed">
                  Join thousands of sellers who trust BhoomiTayi. List your service
                  in minutes and reach millions of potential buyers across India.
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
                      Register Your Service
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
                    <Link href="/houses">Browse Services</Link>
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
