"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/lib/store";

export function NativeAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthStore();
  const [isNative, setIsNative] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if running in a native Capacitor environment
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (checking || loading) return;

    // If it's a native app, force user to login/signup pages if they aren't authenticated
    if (isNative && !user) {
      if (!pathname.startsWith("/auth")) {
        router.replace("/auth/login");
      }
    }
  }, [checking, loading, isNative, user, pathname, router]);

  // If we are checking auth or native status, optionally show a loader
  if (isNative && !user && !pathname.startsWith("/auth")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="size-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
