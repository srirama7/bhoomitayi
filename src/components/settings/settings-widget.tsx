"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2,
  X,
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Eye,
  Zap,
  Minimize2,
  Type,
  Globe,
  RotateCcw,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/lib/settings-store";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { toast } from "sonner";

export function SettingsWidget() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const settings = useSettingsStore();

  useEffect(() => setMounted(true), []);

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "Auto", icon: Monitor },
  ];

  const fontSizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
    { value: "xlarge", label: "Extra Large" },
  ] as const;

  const handleReset = () => {
    settings.resetAll();
    setTheme("system");
    toast.success("Settings reset to defaults");
  };

  return (
    <>
      {/* Floating Settings Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 left-6 z-50"
          >
            <Button
              onClick={() => setOpen(true)}
              className="size-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-600 dark:to-zinc-800 hover:from-zinc-800 hover:to-zinc-950 shadow-xl shadow-black/20 hover:shadow-black/40 transition-all duration-300"
            >
              <motion.div
                animate={{ rotate: open ? 0 : 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Settings2 className="size-5 text-white" />
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-6 z-50 w-[320px] max-w-[calc(100vw-48px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "520px", maxHeight: "calc(100vh - 100px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-zinc-700 to-zinc-900 text-white">
              <div className="flex items-center gap-2">
                <Settings2 className="size-5" />
                <h3 className="font-bold text-sm">Quick Settings</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="size-8 rounded-full text-white hover:bg-white/20"
              >
                <X className="size-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {/* Theme */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sun className="size-3.5" /> Theme
                  </Label>
                  {mounted && (
                    <div className="grid grid-cols-3 gap-2">
                      {themeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = theme === opt.value;
                        return (
                          <Button
                            key={opt.value}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className={`rounded-xl h-10 gap-1.5 text-xs ${
                              isActive
                                ? "bg-gradient-to-r from-zinc-700 to-zinc-900 text-white border-0"
                                : ""
                            }`}
                            onClick={() => setTheme(opt.value)}
                          >
                            <Icon className="size-3.5" />
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Font Size */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Type className="size-3.5" /> Font Size
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {fontSizes.map((fs) => (
                      <Button
                        key={fs.value}
                        variant={settings.fontSize === fs.value ? "default" : "outline"}
                        size="sm"
                        className={`rounded-lg h-9 text-xs px-2 ${
                          settings.fontSize === fs.value
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0"
                            : ""
                        }`}
                        onClick={() => settings.setFontSize(fs.value)}
                      >
                        {fs.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Reading Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-amber-600" />
                    <div>
                      <Label className="text-sm font-medium">Reading Mode</Label>
                      <p className="text-xs text-muted-foreground">Warm tones, serif font</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.readingMode}
                    onCheckedChange={settings.setReadingMode}
                  />
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-purple-600" />
                    <div>
                      <Label className="text-sm font-medium">High Contrast</Label>
                      <p className="text-xs text-muted-foreground">Better visibility</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={settings.setHighContrast}
                  />
                </div>

                {/* Reduce Animations */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-yellow-600" />
                    <div>
                      <Label className="text-sm font-medium">Reduce Animations</Label>
                      <p className="text-xs text-muted-foreground">Less motion, faster feel</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.reduceAnimations}
                    onCheckedChange={settings.setReduceAnimations}
                  />
                </div>

                {/* Compact Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Minimize2 className="size-4 text-green-600" />
                    <div>
                      <Label className="text-sm font-medium">Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">Tighter spacing</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={settings.setCompactMode}
                  />
                </div>

                <Separator />

                {/* Language */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Globe className="size-3.5" /> Language
                  </Label>
                  <Select value={i18n.language} onValueChange={(v) => i18n.changeLanguage(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.nativeLabel} ({lang.label})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Reset */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl gap-2 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={handleReset}
                >
                  <RotateCcw className="size-3.5" />
                  Reset All Settings
                </Button>
              </div>
            </ScrollArea>

            <div className="border-t px-4 py-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                Tip: Ask Bella to change settings via chat!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
