"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { toast } from "sonner";

export function CapacitorBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [backPressTime, setBackPressTime] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      // If we are not at the root page, navigate back
      if (pathname !== "/") {
        router.back();
      } else {
        // We are on the main page. Press back twice within 2 seconds to exit.
        const currentTime = new Date().getTime();
        if (currentTime - backPressTime < 2000) {
          App.exitApp();
        } else {
          setBackPressTime(currentTime);
          toast("Press back again to exit");
        }
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [router, pathname, backPressTime]);

  return null;
}
