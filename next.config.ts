import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_TARGET === "capacitor" ? "export" : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "real-estate-4a9f1.firebasestorage.app",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // Reduces peak webpack memory usage (trades a bit of build speed for lower RAM)
    webpackMemoryOptimizations: true,
    // Tree-shake large packages so only used components are compiled into memory
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "firebase",
      "date-fns",
      "radix-ui",
    ],
  },
};

export default nextConfig;

