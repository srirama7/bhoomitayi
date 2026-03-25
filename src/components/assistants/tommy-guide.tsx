"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const TOMMY_AVATAR = "/tommy-avatar.avif";

interface GuideStep {
  titleKey: string;
  contentKey: string;
}

interface PageGuide {
  greetingKey: string;
  steps: GuideStep[];
}

const PAGE_GUIDES: Record<string, PageGuide> = {
  "/": {
    greetingKey: "tommy.home_greeting",
    steps: [
      { titleKey: "tommy.home_step1_title", contentKey: "tommy.home_step1" },
      { titleKey: "tommy.home_step2_title", contentKey: "tommy.home_step2" },
      { titleKey: "tommy.home_step3_title", contentKey: "tommy.home_step3" },
      { titleKey: "tommy.home_step4_title", contentKey: "tommy.home_step4" },
    ],
  },
  "/houses": {
    greetingKey: "tommy.houses_greeting",
    steps: [
      { titleKey: "Filter Results", contentKey: "Use the filter options to narrow down by price range, number of bedrooms, location, and more." },
      { titleKey: "View Listings", contentKey: "Click on any property card to see full details, photos, location map, and seller contact info." },
      { titleKey: "Save Favorites", contentKey: "Like a property? Click the heart icon to save it to your favorites." },
      { titleKey: "Contact Seller", contentKey: "Found your dream home? Click 'Send Inquiry' to contact the seller directly." },
    ],
  },
  "/land": {
    greetingKey: "tommy.land_greeting",
    steps: [
      { titleKey: "Check Plot Details", contentKey: "Always look for dimensions, total area in sq.ft, and whether it's a corner plot." },
      { titleKey: "Verify Documents", contentKey: "Look for Khata type (A/B), EC availability, and BBMP/BDA approval." },
      { titleKey: "Compare Prices", contentKey: "Check the per sq.ft rate and compare with nearby listings." },
      { titleKey: "Visit Before Buying", contentKey: "Always schedule a site visit. Check road access, water supply, and surrounding development." },
    ],
  },
  "/pg": {
    greetingKey: "tommy.pg_greeting",
    steps: [
      { titleKey: "Check Amenities", contentKey: "Look for WiFi, food, laundry, and power backup details in the listing." },
      { titleKey: "Location Matters", contentKey: "Check distance to your workplace/college. Listings near metro/bus stops save commute time." },
      { titleKey: "Rent Details", contentKey: "Note the monthly rent, security deposit, and what's included." },
      { titleKey: "House Rules", contentKey: "Check visitor policy, entry timings, and food timings before booking." },
    ],
  },
  "/commercial": {
    greetingKey: "tommy.commercial_greeting",
    steps: [
      { titleKey: "Space Requirements", contentKey: "Calculate how much space you need. Check carpet area vs super built-up area." },
      { titleKey: "Location Analysis", contentKey: "Check foot traffic, parking availability, and proximity to public transport." },
      { titleKey: "Lease Terms", contentKey: "Look for rent escalation clauses, lock-in period, and maintenance charges." },
      { titleKey: "Infrastructure", contentKey: "Verify power backup, internet connectivity, fire safety, and lift access." },
    ],
  },
  "/vehicles": {
    greetingKey: "tommy.vehicles_greeting",
    steps: [
      { titleKey: "Check Vehicle Details", contentKey: "Look for year of manufacture, kilometers driven, number of owners, and fuel type." },
      { titleKey: "Verify Papers", contentKey: "Ensure RC book, insurance, pollution certificate are valid." },
      { titleKey: "Compare Prices", contentKey: "Check similar vehicles on the platform and compare prices." },
      { titleKey: "Test Drive", contentKey: "Always request a test drive before buying." },
    ],
  },
  "/commodities": {
    greetingKey: "tommy.default_greeting",
    steps: [
      { titleKey: "Product Details", contentKey: "Check quantity, quality specifications, and pricing per unit." },
      { titleKey: "Seller Rating", contentKey: "Look at the seller's profile and other listings to ensure reliability." },
      { titleKey: "Delivery & Pickup", contentKey: "Check if delivery is available or if you need to pick up." },
      { titleKey: "Bulk Pricing", contentKey: "Many sellers offer discounts for bulk purchases. Contact the seller to negotiate." },
    ],
  },
  "/sell": {
    greetingKey: "tommy.sell_greeting",
    steps: [
      { titleKey: "Step 1: Choose Category", contentKey: "Select what you're selling - House, Land, PG, Commercial, Vehicle, or Commodity." },
      { titleKey: "Step 2: Fill Details", contentKey: "Add a clear title, detailed description, exact measurements, and a competitive price." },
      { titleKey: "Step 3: Upload Photos", contentKey: "Add high quality photos. First photo becomes the thumbnail. Use natural lighting!" },
      { titleKey: "Step 4: Set Location", contentKey: "Enter the exact address and area. Accurate location helps buyers find your listing." },
      { titleKey: "Step 5: Submit", contentKey: "Review everything, then submit. Your listing goes live immediately!" },
    ],
  },
  "/auth/login": {
    greetingKey: "tommy.login_greeting",
    steps: [
      { titleKey: "Email & Password", contentKey: "Enter your registered email and password. Make sure caps lock is off!" },
      { titleKey: "Google Sign-In", contentKey: "You can also click 'Sign in with Google' for quick one-click login." },
      { titleKey: "Forgot Password?", contentKey: "Click 'Forgot Password' to receive a reset link on your email." },
      { titleKey: "New User?", contentKey: "Don't have an account? Click 'Sign Up' to create one - it's free!" },
    ],
  },
  "/auth/signup": {
    greetingKey: "tommy.signup_greeting",
    steps: [
      { titleKey: "Full Name", contentKey: "tommy.signup_field_name" },
      { titleKey: "Phone Number", contentKey: "tommy.signup_field_phone" },
      { titleKey: "Email", contentKey: "tommy.signup_field_email" },
      { titleKey: "Password", contentKey: "tommy.signup_field_password" },
      { titleKey: "Confirm Password", contentKey: "tommy.signup_field_confirm" },
    ],
  },
  "/dashboard": {
    greetingKey: "tommy.dashboard_greeting",
    steps: [
      { titleKey: "Overview Stats", contentKey: "See your total listings, active listings, pending listings, and total inquiries at a glance." },
      { titleKey: "Manage Listings", contentKey: "Go to 'My Listings' to edit, delete, or view your posted properties." },
      { titleKey: "Check Inquiries", contentKey: "Click 'Inquiries' to see messages from interested buyers. Respond quickly!" },
      { titleKey: "Update Profile", contentKey: "Keep your profile updated with phone number and photo for buyer trust." },
    ],
  },
  "/contact": {
    greetingKey: "tommy.default_greeting",
    steps: [
      { titleKey: "Fill the Form", contentKey: "Enter your name, email, and message. Be specific for a faster response." },
      { titleKey: "Response Time", contentKey: "We typically respond within 24 hours on business days." },
    ],
  },
};

// Map signup field IDs to step indices
const SIGNUP_FIELD_MAP: Record<string, number> = {
  fullName: 0,
  phone: 1,
  email: 2,
  password: 3,
  confirmPassword: 4,
};

function getGuideForPath(path: string): PageGuide {
  if (PAGE_GUIDES[path]) return PAGE_GUIDES[path];
  for (const key of Object.keys(PAGE_GUIDES)) {
    if (path.startsWith(key) && key !== "/") return PAGE_GUIDES[key];
  }
  return {
    greetingKey: "tommy.default_greeting",
    steps: [
      { titleKey: "Explore", contentKey: "Browse through the content on this page. Use the navigation menu to go to different sections." },
      { titleKey: "Need Help?", contentKey: "Click on Bella (the chat icon) to ask questions or get assistance anytime." },
    ],
  };
}

export function TommyGuide() {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Drag state
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  const guide = getGuideForPath(pathname);

  // Initialize position at bottom-left on mount
  useEffect(() => {
    if (position.x === -1) {
      setPosition({
        x: 80,
        y: window.innerHeight - 80,
      });
    }
  }, [position.x]);

  // Resolve text: if it looks like a translation key (contains dots), translate it; otherwise use as-is
  const resolveText = useCallback((key: string) => {
    if (key.includes(".")) {
      const translated = t(key);
      if (translated !== key) return translated;
    }
    return key;
  }, [t]);

  // Auto-open when page changes (if not dismissed for this page)
  useEffect(() => {
    setCurrentStep(0);
    if (!dismissed.has(pathname)) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
    setOpen(false);
  }, [pathname, dismissed]);

  // Re-show when language changes
  useEffect(() => {
    setDismissed(new Set());
  }, [i18n.language]);

  // Auto-advance on signup page when user focuses different fields
  useEffect(() => {
    if (pathname !== "/auth/signup") return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" && target.id) {
        const stepIndex = SIGNUP_FIELD_MAP[target.id];
        if (stepIndex !== undefined) {
          setCurrentStep(stepIndex);
          if (!open) setOpen(true);
        }
      }
    };

    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, [pathname, open]);

  // ── Drag handlers ──
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (open) return;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [open, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = Math.max(32, Math.min(window.innerWidth - 32, e.clientX - dragOffset.current.x));
    const newY = Math.max(32, Math.min(window.innerHeight - 32, e.clientY - dragOffset.current.y));
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    // Only open if it was a click (not a drag)
    if (dx < 5 && dy < 5) {
      setOpen(true);
    }
  }, [isDragging]);

  // ── Smart guide box position ──
  const getGuideBoxStyle = useCallback((): React.CSSProperties => {
    const boxW = 320;
    const boxH = 300;
    const pad = 12;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;

    let left = position.x - boxW / 2;
    let top = position.y - boxH - pad;

    // Horizontal: prefer right side if near left edge
    if (position.x < vw / 2) {
      left = position.x + pad + 32;
    } else {
      left = position.x - boxW - pad - 32;
    }

    // Clamp horizontal
    if (left + boxW > vw - pad) left = vw - boxW - pad;
    if (left < pad) left = pad;

    // If not enough space above, open below
    if (top < pad) {
      top = position.y + pad + 32;
    }
    // Clamp vertical
    if (top + boxH > vh - pad) {
      top = vh - boxH - pad;
    }
    if (top < pad) top = pad;

    return {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.min(boxW, vw - pad * 2)}px`,
      zIndex: 41,
    };
  }, [position]);

  const handleDismiss = () => {
    setOpen(false);
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

  if (pathname === "/dashboard/tommy") return null;

  // Use mounted flag to avoid SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Initialize position on first mount
  if (position.x === -1) {
    // Will be set by the useEffect, render nothing for now
    return null;
  }

  return (
    <div id="tommy-guide-root">
      {/* Draggable Tommy Circle - always visible */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="button"
        aria-label="Tommy Guide"
        className="fixed z-40 touch-none select-none"
        style={{
          left: `${position.x - 32}px`,
          top: `${position.y - 32}px`,
          cursor: isDragging ? "grabbing" : "grab",
          display: open ? "none" : "block",
        }}
      >
        <div className="size-16 rounded-full shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 overflow-hidden ring-3 ring-orange-400 hover:ring-orange-500 hover:scale-105">
          <Image src={TOMMY_AVATAR} alt="Tommy" width={64} height={64} className="size-full object-cover pointer-events-none" />
        </div>
        <span className="absolute -top-1 -left-1 flex size-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-4 bg-orange-500" />
        </span>
      </div>

      {/* Guide Panel - smart positioning */}
      {open && (
        <div
          style={getGuideBoxStyle()}
          className="rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full overflow-hidden ring-2 ring-white/30">
                <Image src={TOMMY_AVATAR} alt="Tommy" width={32} height={32} className="size-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-xs">{t("tommy.name")}</h4>
                <p className="text-[10px] text-white/70">
                  {t("tommy.step_of", { current: currentStep + 1, total: guide.steps.length })}
                </p>
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
              <p className="text-xs text-muted-foreground mb-3">{resolveText(guide.greetingKey)}</p>
            )}
            <div className="space-y-1.5">
              <h5 className="font-bold text-sm text-foreground">{resolveText(guide.steps[currentStep].titleKey)}</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">{resolveText(guide.steps[currentStep].contentKey)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-1">
            <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / guide.steps.length) * 100}%` }}
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
              <ChevronLeft className="size-3" /> {t("tommy.back")}
            </Button>
            <button
              onClick={handleDismiss}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("tommy.skip")}
            </button>
            <Button
              size="sm"
              onClick={nextStep}
              className="rounded-lg h-8 text-xs gap-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
            >
              {currentStep < guide.steps.length - 1 ? (
                <>{t("tommy.next")} <ChevronRight className="size-3" /></>
              ) : (
                t("tommy.done")
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
