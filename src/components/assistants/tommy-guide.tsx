"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const TOMMY_AVATAR = "/tommy-avatar.avif";

interface GuideStep {
  title: string;
  content: string;
}

interface PageGuide {
  greeting: string;
  steps: GuideStep[];
}

const PAGE_GUIDES: Record<string, PageGuide> = {
  "/": {
    greeting: "Welcome to BhoomiTayi! I'm Tommy, your guide. Let me show you around!",
    steps: [
      { title: "Search Properties", content: "Use the search bar at the top to find properties by location, type, or keyword. Try searching for your city name!" },
      { title: "Browse Categories", content: "Scroll down to see all categories - Houses, Land, PG, Commercial, Vehicles & Commodities. Click any card to browse listings." },
      { title: "Register a Service", content: "Want to sell? Click the green 'Register Service' button in the navbar to list your property for free!" },
      { title: "Create an Account", content: "Sign up to save favorites, post listings, and get inquiry alerts. Click 'Sign Up' in the top right corner." },
    ],
  },
  "/houses": {
    greeting: "You're browsing Houses! Let me help you find the perfect home.",
    steps: [
      { title: "Filter Results", content: "Use the filter options to narrow down by price range, number of bedrooms, location, and more." },
      { title: "View Listings", content: "Click on any property card to see full details, photos, location map, and seller contact info." },
      { title: "Save Favorites", content: "Like a property? Click the heart icon to save it to your favorites. You'll need to be logged in." },
      { title: "Contact Seller", content: "Found your dream home? Click 'Send Inquiry' on the listing page to contact the seller directly." },
    ],
  },
  "/land": {
    greeting: "Looking for land? Great investment choice! Here's how to navigate.",
    steps: [
      { title: "Check Plot Details", content: "Always look for dimensions (30x40, 40x60 etc.), total area in sq.ft, and whether it's a corner plot." },
      { title: "Verify Documents", content: "Good listings mention Khata type (A/B), EC availability, and BBMP/BDA approval. Look for these details!" },
      { title: "Compare Prices", content: "Check the per sq.ft rate and compare with nearby listings to ensure fair pricing." },
      { title: "Visit Before Buying", content: "Always schedule a site visit. Check road access, water supply, and surrounding development." },
    ],
  },
  "/pg": {
    greeting: "Searching for PG accommodation? Let me guide you!",
    steps: [
      { title: "Check Amenities", content: "Look for WiFi, food, laundry, and power backup details in the listing. These make a big difference!" },
      { title: "Location Matters", content: "Check distance to your workplace/college. Listings near metro/bus stops save commute time." },
      { title: "Rent Details", content: "Note the monthly rent, security deposit, and what's included (electricity, water, food)." },
      { title: "House Rules", content: "Check visitor policy, entry timings, and food timings before booking. Ask the owner for details." },
    ],
  },
  "/commercial": {
    greeting: "Looking for commercial space? Smart business move! Here's your guide.",
    steps: [
      { title: "Space Requirements", content: "Calculate how much space you need. Check carpet area vs super built-up area in listings." },
      { title: "Location Analysis", content: "Check foot traffic, parking availability, and proximity to public transport for your business." },
      { title: "Lease Terms", content: "Look for rent escalation clauses, lock-in period, and maintenance charges in the listing details." },
      { title: "Infrastructure", content: "Verify power backup, internet connectivity, fire safety, and lift access for your floor." },
    ],
  },
  "/vehicles": {
    greeting: "Browsing vehicles? Let me help you find a great deal!",
    steps: [
      { title: "Check Vehicle Details", content: "Look for year of manufacture, kilometers driven, number of owners, and fuel type." },
      { title: "Verify Papers", content: "Ensure RC book, insurance, pollution certificate are valid. Check for any hypothecation." },
      { title: "Compare Prices", content: "Check similar vehicles on the platform and compare prices. Factor in age and condition." },
      { title: "Test Drive", content: "Always request a test drive before buying. Check engine, brakes, tyres, and AC." },
    ],
  },
  "/commodities": {
    greeting: "Browsing commodities? Here's how to find what you need.",
    steps: [
      { title: "Product Details", content: "Check quantity, quality specifications, and pricing per unit mentioned in the listing." },
      { title: "Seller Rating", content: "Look at the seller's profile, other listings, and reviews to ensure reliability." },
      { title: "Delivery & Pickup", content: "Check if delivery is available or if you need to pick up. Factor in transport costs." },
      { title: "Bulk Pricing", content: "Many sellers offer discounts for bulk purchases. Contact the seller to negotiate." },
    ],
  },
  "/sell": {
    greeting: "Ready to sell? Awesome! I'll walk you through every step.",
    steps: [
      { title: "Step 1: Choose Category", content: "Select what you're selling - House, Land, PG, Commercial, Vehicle, or Commodity. Pick the right one!" },
      { title: "Step 2: Fill Details", content: "Add a clear title, detailed description, exact measurements, and a competitive price." },
      { title: "Step 3: Upload Photos", content: "Add 6-10 high quality photos. First photo becomes the thumbnail. Use natural lighting!" },
      { title: "Step 4: Set Location", content: "Enter the exact address and area. Accurate location helps buyers find your listing." },
      { title: "Step 5: Submit & Go Live", content: "Review everything, then submit. Your listing goes live immediately and buyers can start contacting you!" },
    ],
  },
  "/auth/login": {
    greeting: "Welcome back! Let me help you sign in.",
    steps: [
      { title: "Email & Password", content: "Enter your registered email and password. Make sure caps lock is off!" },
      { title: "Google Sign-In", content: "You can also click 'Sign in with Google' for quick one-click login." },
      { title: "Forgot Password?", content: "Click 'Forgot Password' to receive a reset link on your email. Check spam folder if you don't see it." },
      { title: "New User?", content: "Don't have an account? Click 'Sign Up' to create one - it's free and takes 30 seconds!" },
    ],
  },
  "/auth/signup": {
    greeting: "Creating an account? Great choice! Here's what you need.",
    steps: [
      { title: "Enter Your Details", content: "Fill in your full name, email address, and create a strong password (8+ characters)." },
      { title: "Or Use Google", content: "Click 'Sign up with Google' for the fastest way to create an account." },
      { title: "Complete Profile", content: "After signing up, go to Dashboard > Profile to add your phone number and photo." },
      { title: "Start Using", content: "Once signed up, you can post listings, save favorites, and receive inquiries!" },
    ],
  },
  "/dashboard": {
    greeting: "Welcome to your Dashboard! Here's your control center.",
    steps: [
      { title: "Overview Stats", content: "See your total listings, active listings, pending listings, and total inquiries at a glance." },
      { title: "Manage Listings", content: "Go to 'My Listings' to edit, delete, or view your posted properties." },
      { title: "Check Inquiries", content: "Click 'Inquiries' to see messages from interested buyers. Respond quickly!" },
      { title: "Update Profile", content: "Keep your profile updated with phone number and photo for buyer trust." },
    ],
  },
  "/contact": {
    greeting: "Need to reach us? Here's how!",
    steps: [
      { title: "Fill the Form", content: "Enter your name, email, and message. Be specific about your question for a faster response." },
      { title: "Response Time", content: "We typically respond within 24 hours on business days." },
    ],
  },
};

function getGuideForPath(path: string): PageGuide {
  // Exact match first
  if (PAGE_GUIDES[path]) return PAGE_GUIDES[path];

  // Prefix match
  for (const key of Object.keys(PAGE_GUIDES)) {
    if (path.startsWith(key) && key !== "/") return PAGE_GUIDES[key];
  }

  // Default
  return {
    greeting: "I'm Tommy, your guide! I can help you navigate this page. Ask me anything!",
    steps: [
      { title: "Explore", content: "Browse through the content on this page. Use the navigation menu to go to different sections." },
      { title: "Need Help?", content: "Click on Bella (the chat icon on the right) to ask questions or get assistance anytime." },
    ],
  };
}

export function TommyGuide() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const guide = getGuideForPath(pathname);

  // Show Tommy when page changes (if not dismissed for this page)
  useEffect(() => {
    setCurrentStep(0);
    if (!dismissed.has(pathname)) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [pathname, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed((prev) => new Set(prev).add(pathname));
  };

  const nextStep = () => {
    if (currentStep < guide.steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  // Don't show on dashboard/tommy page itself
  if (pathname === "/dashboard/tommy") return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-6 z-40 w-[320px] max-w-[calc(100vw-48px)] rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full overflow-hidden ring-2 ring-white/30">
                <Image src={TOMMY_AVATAR} alt="Tommy" width={32} height={32} className="size-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-xs">Tommy&apos;s Guide</h4>
                <p className="text-[10px] text-white/70">Step {currentStep + 1} of {guide.steps.length}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="size-7 rounded-full text-white hover:bg-white/20"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4">
            {currentStep === 0 && (
              <p className="text-xs text-muted-foreground mb-3">{guide.greeting}</p>
            )}
            <div className="space-y-1.5">
              <h5 className="font-bold text-sm text-foreground">{guide.steps[currentStep].title}</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">{guide.steps[currentStep].content}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-1">
            <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / guide.steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="rounded-lg h-8 text-xs gap-1"
            >
              <ChevronLeft className="size-3" /> Back
            </Button>
            <button
              onClick={handleDismiss}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip guide
            </button>
            <Button
              size="sm"
              onClick={nextStep}
              className="rounded-lg h-8 text-xs gap-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
            >
              {currentStep < guide.steps.length - 1 ? (
                <>Next <ChevronRight className="size-3" /></>
              ) : (
                "Done!"
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
