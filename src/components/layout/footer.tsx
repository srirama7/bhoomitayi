"use client";

import Link from "next/link";
import { Home, ArrowUpRight, Heart } from "lucide-react";
import { motion } from "framer-motion";

const browseLinks = [
  { label: "Houses", href: "/houses" },
  { label: "Land", href: "/land" },
  { label: "PG", href: "/pg" },
  { label: "Commercial", href: "/commercial" },
];

const accountLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Favorites", href: "/dashboard/favorites" },
  { label: "Register Service", href: "/sell" },
];

const legalLinks = [
  { label: "About Us", href: "/about" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Gradient glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 max-w-xl h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      {/* Subtle background orb */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-100/20 dark:bg-blue-900/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div className="flex flex-col gap-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl group"
            >
              <div className="relative flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
                <Home className="size-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent font-extrabold tracking-tight">
                BhoomiTayi
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              BhoomiTayi is an online marketplace connecting
              buyers, sellers, and service providers across India.
            </p>
          </div>

          {/* Browse */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Browse</h3>
            <ul className="flex flex-col gap-2.5">
              {browseLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3 opacity-0 -translate-y-0.5 translate-x-0 group-hover:opacity-100 group-hover:-translate-y-0 group-hover:translate-x-0.5 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Account</h3>
            <ul className="flex flex-col gap-2.5">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3 opacity-0 -translate-y-0.5 translate-x-0 group-hover:opacity-100 group-hover:-translate-y-0 group-hover:translate-x-0.5 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Legal</h3>
            <ul className="flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3 opacity-0 -translate-y-0.5 translate-x-0 group-hover:opacity-100 group-hover:-translate-y-0 group-hover:translate-x-0.5 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-14 border-t border-zinc-200/80 dark:border-zinc-800/60 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} BhoomiTayi. All rights reserved.
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground/60">
              Made with <Heart className="size-3 text-red-400 fill-red-400" /> in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
