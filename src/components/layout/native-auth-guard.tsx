"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/lib/store";

export function NativeAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthStore();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (loading) return;

    // On native: if not authenticated and not already on an auth page, redirect to login
    if (isNative && !user) {
      if (!pathname.startsWith("/auth")) {
        router.replace("/auth/login");
      }
    }
  }, [loading, isNative, user, pathname, router]);

  // Never block rendering with a spinner — the router.replace in logout handlers
  // handles navigation immediately. Showing a spinner here caused the "hang" appearance.
  return <>{children}</>;
}

