import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BellaChat } from "@/components/assistants/bella-chat";
import { TommyGuide } from "@/components/assistants/tommy-guide";
import { SettingsWidget } from "@/components/settings/settings-widget";
import { SettingsApplier } from "@/components/settings/settings-applier";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BhoomiTayi - Online Marketplace | Buy, Sell & Rent Services",
  description:
    "BhoomiTayi is India's trusted online marketplace helping you buy, sell, and rent across categories including homes, vehicles, commercial spaces, and more.",
  openGraph: {
    title: "BhoomiTayi - Online Marketplace | Buy, Sell & Rent Services",
    description:
      "BhoomiTayi is India's trusted online marketplace helping you buy, sell, and rent across categories including homes, vehicles, commercial spaces, and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <TooltipProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
