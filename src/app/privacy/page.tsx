import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - BhoomiTayi",
  description: "Privacy Policy for BhoomiTayi real estate marketplace - How we handle your data",
};

export default function PrivacyPolicyPage() {
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
              <Shield className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            Last updated: February 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto space-y-8">
          <Section title="1. Information We Collect">
            <p>
              When you use BhoomiTayi, we may collect the following information:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Account Information:</strong> Name, email address, phone number, and city when you create an account.</li>
              <li><strong>Property Data:</strong> Property details, images, descriptions, and pricing that you submit when listing a property.</li>
              <li><strong>Usage Data:</strong> Pages visited, search queries, and interactions with listings to improve our services.</li>
              <li><strong>Device Information:</strong> Browser type, device type, and IP address for security and analytics.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain the BhoomiTayi platform.</li>
              <li>To facilitate communication between property owners and interested buyers or tenants.</li>
              <li>To send important notifications about your account and listings.</li>
              <li>To improve our services and develop new features.</li>
              <li>To prevent fraud and ensure platform security.</li>
            </ul>
          </Section>

          <Section title="3. Information Sharing">
            <p>
              We do not sell your personal data. We may share information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Other Users:</strong> Your name and contact details are shared with users who inquire about your property listings.</li>
              <li><strong>Third-Party Services:</strong> We use trusted third-party services for hosting, analytics, payment processing (Cashfree), and email delivery.</li>
              <li><strong>Legal Requirements:</strong> We may disclose data if required by law or to protect our rights.</li>
            </ul>
          </Section>

          <Section title="4. Data Security">
            <p>
              We use industry-standard encryption and security measures to protect your data. All data is transmitted over HTTPS, and passwords are securely hashed. However, no method of transmission over the Internet is 100% secure.
            </p>
          </Section>

          <Section title="5. Your Rights">
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and download your personal data.</li>
              <li>Update or correct your profile information.</li>
              <li>Delete your account and associated data.</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookie settings in your browser.
            </p>
          </Section>

          <Section title="7. Contact Us">
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@bhoomitayi.in" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                privacy@bhoomitayi.in
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-3d p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}
