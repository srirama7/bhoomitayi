import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Inter({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bhoomitayi.com"),
  title: "BhoomiTayi - Online Marketplace | Buy, Sell & Rent Services",
  description:
    "BhoomiTayi is India's trusted online marketplace helping you buy, sell, and rent across categories including homes, vehicles, commercial spaces, and more.",
  keywords: ["bhoomitayi", "online marketplace", "buy and sell", "real estate", "vehicles", "commercial properties", "India"],
  authors: [{ name: "BhoomiTayi" }],
  openGraph: {
    title: "BhoomiTayi - Online Marketplace | Buy, Sell & Rent Services",
    description:
      "BhoomiTayi is India's trusted online marketplace helping you buy, sell, and rent across categories including homes, vehicles, commercial spaces, and more.",
    url: "https://www.bhoomitayi.com",
    siteName: "BhoomiTayi",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "N3NRStwIOhKJ281RwTbeVm2dBqVIQ3slUWbddXWxh74",
  },
};

import { NativeAuthGuard } from "@/components/layout/native-auth-guard";
import { NativeBodyClass } from "@/components/layout/native-body-class";

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
          <NativeBodyClass />
          <ErrorBoundary>
            <I18nProvider>
              <AuthProvider>
                <TooltipProvider>
                  <NativeAuthGuard>
                    <LayoutWrapper>{children}</LayoutWrapper>
                  </NativeAuthGuard>
                  <Toaster richColors position="bottom-center" />
                </TooltipProvider>
              </AuthProvider>
            </I18nProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
