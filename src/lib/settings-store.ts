import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CalculatorType = "emi" | "roi" | "area" | "stamp" | "afford" | "scientific" | "currency" | "measure" | "volume" | "weight" | "temp" | "speed" | "time" | "sip" | "tax" | "retirement" | "margin" | "discount" | "gst" | "breakeven" | "age" | "datediff" | null;

export interface SiteSettings {
  // Appearance
  fontSize: "small" | "medium" | "large" | "xlarge";
  readingMode: boolean;
  highContrast: boolean;
  reduceAnimations: boolean;
  compactMode: boolean;

  // Notifications
  emailNotifications: boolean;
  inquiryAlerts: boolean;
  marketingEmails: boolean;
  hasSeenOnboarding: boolean;

  // Calculators
  activeCalculator: CalculatorType;

  // Settings Widget
  isSettingsOpen: boolean;

  // Actions
  setFontSize: (size: SiteSettings["fontSize"]) => void;
  setReadingMode: (on: boolean) => void;
  setHighContrast: (on: boolean) => void;
  setReduceAnimations: (on: boolean) => void;
  setCompactMode: (on: boolean) => void;
  setEmailNotifications: (on: boolean) => void;
  setInquiryAlerts: (on: boolean) => void;
  setMarketingEmails: (on: boolean) => void;
  setHasSeenOnboarding: (on: boolean) => void;
  setActiveCalculator: (calc: CalculatorType) => void;
  setSettingsOpen: (open: boolean) => void;
  resetAll: () => void;
}

const defaults = {
  fontSize: "medium" as const,
  readingMode: false,
  highContrast: false,
  reduceAnimations: false,
  compactMode: false,
  emailNotifications: true,
  inquiryAlerts: true,
  marketingEmails: false,
  hasSeenOnboarding: false,
  activeCalculator: null as CalculatorType,
  isSettingsOpen: false,
};

export const useSettingsStore = create<SiteSettings>()(
  persist(
    (set) => ({
      ...defaults,
      setFontSize: (fontSize) => set({ fontSize }),
      setReadingMode: (readingMode) => set({ readingMode }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setReduceAnimations: (reduceAnimations) => set({ reduceAnimations }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
      setInquiryAlerts: (inquiryAlerts) => set({ inquiryAlerts }),
      setMarketingEmails: (marketingEmails) => set({ marketingEmails }),
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      setActiveCalculator: (activeCalculator) => set({ activeCalculator }),
      setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      resetAll: () => set(defaults),
    }),
    { name: "bhoomitayi-settings" }
  )
);
