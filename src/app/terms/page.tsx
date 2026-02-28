import { ScrollText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - PropNest",
  description: "Terms of Service for using the PropNest platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-violet-50 via-purple-50/50 to-background dark:from-violet-950/30 dark:via-purple-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-violet-200/30 dark:bg-violet-800/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-purple-200/30 dark:bg-purple-800/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <ScrollText className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            Last updated: February 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using PropNest, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. PropNest reserves the right to update these terms at any time.
            </p>
          </Section>

          <Section title="2. User Accounts">
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to use PropNest.</li>
              <li>One person may not maintain more than one account.</li>
            </ul>
          </Section>

          <Section title="3. Property Listings">
            <ul className="list-disc pl-6 space-y-2">
              <li>You must have legal authority to list a property on PropNest.</li>
              <li>All listing information must be accurate, truthful, and up-to-date.</li>
              <li>PropNest reserves the right to remove any listing that violates our policies.</li>
              <li>You may not list properties involved in illegal activities or disputes.</li>
              <li>Images must be genuine photographs of the listed property.</li>
            </ul>
          </Section>

          <Section title="4. Prohibited Conduct">
            <p>Users may not:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Post false, misleading, or fraudulent listings.</li>
              <li>Harass, spam, or send unsolicited communications to other users.</li>
              <li>Use the platform for money laundering or other illegal activities.</li>
              <li>Attempt to manipulate prices or interfere with other users&apos; listings.</li>
              <li>Scrape, crawl, or use automated tools to extract data from PropNest.</li>
            </ul>
          </Section>

          <Section title="5. PropNest's Role">
            <p>
              PropNest is a platform that connects property owners with potential buyers and renters. We do not:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Verify the ownership or legal status of listed properties.</li>
              <li>Guarantee the accuracy of listing information provided by users.</li>
              <li>Participate in or mediate transactions between users.</li>
              <li>Provide legal, financial, or real estate advice.</li>
            </ul>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>
              PropNest is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from the use of our platform, including but not limited to financial losses from property transactions, disputes between users, or data loss.
            </p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              All content on PropNest, including the design, logos, and software, is owned by PropNest and protected by intellectual property laws. User-submitted content (listings, images) remains the property of the user but is licensed to PropNest for display on the platform.
            </p>
          </Section>

          <Section title="8. Account Termination">
            <p>
              PropNest may suspend or terminate your account if you violate these terms. You may also delete your account at any time from your profile settings. Upon termination, your listings will be removed from the platform.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@propnest.in" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                legal@propnest.in
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
