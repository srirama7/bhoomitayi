"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BellaChat } from "@/components/assistants/bella-chat";
import { SettingsWidget } from "@/components/settings/settings-widget";
import { SettingsApplier } from "@/components/settings/settings-applier";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { FeedbackSidebar } from "@/components/layout/feedback-sidebar";
import { LeftNavigationSidebar } from "@/components/layout/left-navigation-sidebar";

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
  const isAuthPath = pathname.startsWith("/auth");
  const isMinimalLayout = isDashboardPath || isAdminDomain;

  return (
    <div className="flex min-h-screen flex-col">
      {!isMinimalLayout && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isMinimalLayout && !isAuthPath && <Footer />}
      <SettingsApplier />
      {!isMinimalLayout && (
        <>
          <BellaChat />
          <SettingsWidget />
          <OnboardingTour />
          <LeftNavigationSidebar />
          <FeedbackSidebar />
        </>
      )}
    </div>
  );
}
