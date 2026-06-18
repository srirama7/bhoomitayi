"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, ArrowUpRight, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  const browseLinks = [
    { label: t("nav.houses"), href: "/houses" },
    { label: t("nav.land"), href: "/land" },
    { label: t("nav.pg"), href: "/pg" },
    { label: t("nav.commercial"), href: "/commercial" },
    { label: t("nav.vehicles"), href: "/vehicles" },
    { label: t("nav.commodities"), href: "/commodities" },
  ];

  const accountLinks = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.favorites"), href: "/dashboard/favorites" },
    { label: t("nav.register_service"), href: "/sell" },
  ];

  const legalLinks = [
    { label: t("footer.about_us"), href: "/about" },
    { label: t("footer.privacy_policy"), href: "/privacy" },
    { label: t("footer.terms"), href: "/terms" },
    { label: t("footer.contact_us"), href: "/contact" },
  ];

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
              className="group flex items-center gap-3 transition-all hover:opacity-90"
            >
              <div className="relative flex items-center justify-center size-10 rounded-xl overflow-hidden bg-white shadow-lg">
                <Image src="/logo.png" alt="BhoomiTayi Logo" width={40} height={40} className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent font-extrabold tracking-tight leading-none">
                  BhoomiTayi
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                  by ayushree herbals
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.description")}
            </p>
          </div>

          {/* Browse */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">{t("footer.browse")}</h3>
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
            <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">{t("footer.account")}</h3>
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
            <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">{t("footer.legal")}</h3>
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
              &copy; {new Date().getFullYear()} BhoomiTayi. {t("footer.copyright")}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground/60">
              {t("footer.made_with")} <Heart className="size-3 text-red-400 fill-red-400" /> {t("footer.in_india")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
