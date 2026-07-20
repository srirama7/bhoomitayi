"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/firebase/native-auth";

/**
 * Adds "native-app" class to <body> when running inside the Android WebView.
 * This allows CSS to disable heavy GPU-intensive animations that cause flickering.
 */
export function NativeBodyClass() {
  useEffect(() => {
    if (isNativeApp()) {
      document.body.classList.add("native-app");
    }
  }, []);

  return null;
}
