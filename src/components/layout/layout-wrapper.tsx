"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BellaChat } from "@/components/assistants/bella-chat";
import { TommyGuide } from "@/components/assistants/tommy-guide";
import { SettingsWidget } from "@/components/settings/settings-widget";
import { SettingsApplier } from "@/components/settings/settings-applier";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdminDomain, setIsAdminDomain] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    if (host.includes("admin")) {
      setIsAdminDomain(true);
    }
  }, []);

  const isDashboardPath = pathname.startsWith("/dashboard");
  const showAdminLayout = isDashboardPath || isAdminDomain;

  if (showAdminLayout) {
    return (
      <>
        {children}
        <SettingsApplier />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <SettingsApplier />
      <BellaChat />
      <TommyGuide />
      <SettingsWidget />
      <OnboardingTour />
    </div>
  );
}
