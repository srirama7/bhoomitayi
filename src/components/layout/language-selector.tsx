"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSelector({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const handleChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem("portal_lang", code);
    document.documentElement.lang = code;
    setOpen(false);
  };

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-1">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Globe className="inline size-3 mr-1" />
          {currentLang.nativeLabel}
        </p>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Button
            key={lang.code}
            variant="ghost"
            className={`w-full justify-start gap-2 rounded-xl text-sm ${
              i18n.language === lang.code
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                : ""
            }`}
            onClick={() => handleChange(lang.code)}
          >
            {i18n.language === lang.code && <Check className="size-3.5" />}
            <span>{lang.nativeLabel}</span>
            {lang.code !== "en" && (
              <span className="text-muted-foreground text-xs">({lang.label})</span>
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200"
          >
            <Globe className="size-4" />
            <span className="hidden sm:inline text-sm">{currentLang.nativeLabel}</span>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl shadow-xl border-zinc-200 dark:border-zinc-700/50 backdrop-blur-xl"
      >
        <AnimatePresence>
          {SUPPORTED_LANGUAGES.map((lang, i) => (
            <motion.div
              key={lang.code}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <DropdownMenuItem
                onClick={() => handleChange(lang.code)}
                className={`rounded-lg mx-1 cursor-pointer ${
                  i18n.language === lang.code
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {i18n.language === lang.code && <Check className="size-3.5" />}
                    <span className="font-medium">{lang.nativeLabel}</span>
                  </div>
                  {lang.code !== "en" && (
                    <span className="text-xs text-muted-foreground">{lang.label}</span>
                  )}
                </div>
              </DropdownMenuItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
