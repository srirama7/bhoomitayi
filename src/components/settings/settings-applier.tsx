"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/settings-store";

const FONT_SIZE_MAP = {
  small: "14px",
  medium: "16px",
  large: "18px",
  xlarge: "20px",
};

export function SettingsApplier() {
  const { fontSize, readingMode, highContrast, reduceAnimations, compactMode } =
    useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // Font size
    root.style.fontSize = FONT_SIZE_MAP[fontSize];

    // Reading mode
    root.classList.toggle("reading-mode", readingMode);

    // High contrast
    root.classList.toggle("high-contrast", highContrast);

    // Reduce animations
    root.classList.toggle("reduce-animations", reduceAnimations);

    // Compact mode
    root.classList.toggle("compact-mode", compactMode);
  }, [fontSize, readingMode, highContrast, reduceAnimations, compactMode]);

  return null;
}
