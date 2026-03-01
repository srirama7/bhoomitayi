import { RotateCcw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy - BhoomiTayi",
  description: "Refund and Cancellation Policy for BhoomiTayi real estate marketplace listing services",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-amber-50 via-orange-50/50 to-background dark:from-amber-950/30 dark:via-orange-950/20 dark:to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-200/30 dark:bg-amber-800/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-orange-200/30 dark:bg-orange-800/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <RotateCcw className="size-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Refund &amp; Cancellation Policy</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl">
            Last updated: February 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto space-y-8">
          <Section title="1. Overview">
            <p>
              BhoomiTayi is a real estate marketplace platform. We charge a nominal listing fee to help property owners list and promote their properties to genuine buyers and tenants. This policy outlines the terms under which refunds may be issued.
            </p>
          </Section>

          <Section title="2. Listing Fee">
            <ul className="list-disc pl-6 space-y-2">
              <li>BhoomiTayi charges a one-time, non-recurring listing fee of &#8377;20 (Indian Rupees Twenty) for publishing a property listing on the platform.</li>
              <li>This fee covers the cost of listing verification, platform maintenance, and property promotion.</li>
              <li>The fee is collected at the time of property listing via secure payment through Cashfree payment gateway.</li>
            </ul>
          </Section>

          <Section title="3. Refund Eligibility">
            <p>Refunds may be issued under the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Duplicate Payment:</strong> If a user is charged more than once for the same property listing due to a technical error.</li>
              <li><strong>Listing Not Published:</strong> If the payment was successful but the property listing was not published on the platform due to a system error.</li>
              <li><strong>Unauthorized Transaction:</strong> If the user reports an unauthorized transaction within 7 days of the charge.</li>
            </ul>
          </Section>

          <Section title="4. Non-Refundable Scenarios">
            <ul className="list-disc pl-6 space-y-2">
              <li>The property listing was successfully published and is visible on the platform.</li>
              <li>The user voluntarily removes or deletes their property listing after publishing.</li>
              <li>The listing is removed due to violation of our Terms of Service or fraudulent property details.</li>
              <li>The refund request is made more than 7 days after the payment date.</li>
            </ul>
          </Section>

          <Section title="5. How to Request a Refund">
            <p>
              To request a refund, please contact our support team with the following details:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Your registered email address</li>
              <li>Transaction ID / Payment reference number</li>
              <li>Reason for the refund request</li>
              <li>Date of the transaction</li>
            </ul>
            <p className="mt-3">
              Email us at{" "}
              <a href="mailto:support@bhoomitayi.in" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                support@bhoomitayi.in
              </a>
            </p>
          </Section>

          <Section title="6. Refund Processing">
            <ul className="list-disc pl-6 space-y-2">
              <li>Approved refunds will be processed within 5-7 business days.</li>
              <li>Refunds will be credited back to the original payment method via Cashfree.</li>
              <li>You will receive an email confirmation once the refund has been initiated.</li>
            </ul>
          </Section>

          <Section title="7. Cancellation">
            <ul className="list-disc pl-6 space-y-2">
              <li>Users may remove their property listing at any time from their dashboard.</li>
              <li>Cancellation of a listing does not automatically qualify for a refund (see Section 4).</li>
              <li>BhoomiTayi reserves the right to remove any property listing that violates our Terms of Service.</li>
            </ul>
          </Section>

          <Section title="8. Contact Us">
            <p>
              For any questions regarding refunds or cancellations, please contact us at{" "}
              <a href="mailto:support@bhoomitayi.in" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                support@bhoomitayi.in
              </a>{" "}
              or call us at{" "}
              <a href="tel:+919876543210" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                +91 98765 43210
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
