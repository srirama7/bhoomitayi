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
              <div className="relative flex items-center justify-center size-14 rounded-full shadow-md overflow-hidden">
                <Image src="/logo-v2.png" alt="BhoomiTayi Logo" width={56} height={56} className="object-cover w-full h-full rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent font-extrabold tracking-tight leading-none">
                  BhoomiTayi
                </span>
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                  by ayushree herbals
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.description")}
            </p>

            {/* Social Media & Contact Links */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/bhoomitayi7"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex items-center justify-center size-9 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/20 transition-all hover:scale-110"
                >
                  <svg className="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://youtube.com/@bhoomitayi7?si=KWM9l_VAawUDaNQb"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex items-center justify-center size-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all hover:scale-110"
                >
                  <svg className="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/share/19Ht8mJf4u/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex items-center justify-center size-9 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all hover:scale-110"
                >
                  <svg className="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="mailto:bhoomitayi7@gmail.com"
                  aria-label="Email Support"
                  className="flex items-center justify-center size-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-110"
                >
                  <svg className="size-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </a>
              </div>
              <a
                href="mailto:bhoomitayi7@gmail.com"
                className="text-xs text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1.5"
              >
                <span>Help & Support:</span>
                <span className="text-foreground font-semibold">bhoomitayi7@gmail.com</span>
              </a>
            </div>
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
