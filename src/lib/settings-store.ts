import { create } from "zustand";
import { persist } from "zustand/middleware";

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

  // Actions
  setFontSize: (size: SiteSettings["fontSize"]) => void;
  setReadingMode: (on: boolean) => void;
  setHighContrast: (on: boolean) => void;
  setReduceAnimations: (on: boolean) => void;
  setCompactMode: (on: boolean) => void;
  setEmailNotifications: (on: boolean) => void;
  setInquiryAlerts: (on: boolean) => void;
  setMarketingEmails: (on: boolean) => void;
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
      resetAll: () => set(defaults),
    }),
    { name: "bhoomitayi-settings" }
  )
);
