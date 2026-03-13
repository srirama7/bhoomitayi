import { Building2, Users, Shield, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - BhoomiTayi",
  description: "Learn about BhoomiTayi - your trusted online marketplace for buying, selling, and renting services across India",
};

const FEATURES = [
  {
    icon: Building2,
    title: "Verified Listings",
    description: "Browse thousands of verified listings across multiple categories including homes, vehicles, commercial spaces, and everyday items.",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: Users,
    title: "Verified Sellers",
    description: "All sellers and service providers on our platform go through a verification process to ensure genuine listings and reliability.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Shield,
    title: "Secure Transactions",
    description: "We use industry-standard security measures including encrypted data transmission and secure authentication to protect all user information.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Zap,
    title: "Fast & Easy",
    description: "Our streamlined process makes it quick and easy to list your service or find exactly what you need in just a few clicks.",
    gradient: "from-amber-500 to-orange-600",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-background dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-blue-200/30 dark:bg-blue-800/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-indigo-200/30 dark:bg-indigo-800/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Building2 className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">About BhoomiTayi</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            Your trusted online marketplace for buying, selling &amp; renting services.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Mission */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                BhoomiTayi is an <strong>online marketplace platform</strong> headquartered in Bangalore, India. Our mission is to simplify the process of buying, selling, and renting services by connecting providers directly with genuine buyers and customers.
              </p>
              <p>
                We leverage modern technology to create a seamless experience where users can discover, evaluate, and connect with verified sellers across multiple categories — homes, accommodations, vehicles, commercial spaces, electronics, and more.
              </p>
              <p>
                Founded in 2026, BhoomiTayi has quickly grown to serve thousands of users and sellers across 500+ cities in India, with over 10,000+ verified listings on the platform.
              </p>
            </div>
          </div>

          {/* What We Do */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">What We Do</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                BhoomiTayi operates as an <strong>online marketplace</strong> that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Connects buyers and customers with verified sellers and service providers</li>
                <li>Facilitates inquiries and scheduling between parties</li>
                <li>Provides a secure and transparent environment for discovering services</li>
                <li>Charges a nominal listing fee for verification and platform maintenance</li>
                <li>Offers powerful search tools to help users find the right service across multiple categories</li>
              </ul>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Why Choose BhoomiTayi?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6">
                  <div className={`flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-4`}>
                    <feature.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
            <div className="text-muted-foreground leading-relaxed space-y-2">
              <p><strong>Email:</strong>{" "}<a href="mailto:support@bhoomitayi.in" className="text-blue-600 dark:text-blue-400 hover:underline">support@bhoomitayi.in</a></p>
              <p><strong>Phone:</strong>{" "}<a href="tel:+919876543210" className="text-blue-600 dark:text-blue-400 hover:underline">+91 98765 43210</a></p>
              <p><strong>Address:</strong> Bangalore, Karnataka, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
