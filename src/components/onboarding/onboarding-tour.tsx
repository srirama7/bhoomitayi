"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  HelpCircle,
  Navigation,
  PlusCircle,
  Globe,
  Moon,
  Search,
  PartyPopper,
  RotateCcw,
  MessageCircle,
  BookOpen,
  LogIn,
  Eye,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/lib/settings-store";

// ─── Avatar paths ──────────────────────────────────────────────────────────

const BELLA_AVATAR = "/bella-avatar.jpg";
const TOMMY_AVATAR = "/tommy-avatar.avif";

// ─── Tour Step Definition ──────────────────────────────────────────────────

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  preferredPosition: "bottom" | "top" | "left" | "right" | "center";
  highlight?: boolean;
  avatarSrc?: string;
  isLogo?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetId: "body",
    title: "Welcome to BhoomiTayi! 👋",
    description:
      "Welcome to BhoomiTayi, India's trusted online marketplace where you can discover, buy, sell, rent, and promote services across multiple categories.\n\nLet's take a quick tour!",
    icon: <Image src="/logo-v2.png" alt="BhoomiTayi Logo" width={80} height={80} className="rounded-full object-cover shadow-lg border border-zinc-200 dark:border-zinc-800" />,
    preferredPosition: "center",
    highlight: false,
    isLogo: true,
  },
  {
    id: "register-service",
    targetId: "nav-register-service",
    title: "➕ Register Service",
    description:
      "Register Service is where you add and manage your products/services.\n\n✅ List a house for sale or rent\n✅ Add land listings\n✅ Register PG accommodations\n✅ Post commercial properties\n✅ Sell vehicles\n✅ Add other products\n✅ Promote your business services\n\nAfter registration, your listing becomes visible to potential buyers!",
    icon: <PlusCircle className="size-7 text-green-500" />,
    preferredPosition: "bottom",
    highlight: true,
  },
  {
    id: "bella-ai",
    targetId: "bella-chat-button",
    title: "🤖 Meet Bella AI",
    description:
      "Bella AI helps users navigate the platform, answer questions, and assist with service management.\n\n• Property Search – Find listings based on your needs\n• Smart Recommendations – Suggestions by budget\n• Website Guidance – Explains BhoomiTayi features\n• Listing Assistance – Guides sellers through posting\n• Instant Answers – Questions about pricing & more\n\nClick the Bella icon and start chatting!",
    icon: <MessageCircle className="size-7 text-pink-500" />,
    preferredPosition: "top",
    highlight: true,
    avatarSrc: BELLA_AVATAR,
  },
  {
    id: "navigation",
    targetId: "nav-categories",
    title: "🏠 Top Navigation Bar",
    description:
      "The top panel provides quick access to analytics, notifications, account settings, and important actions.\n\n• Houses – Find houses for sale, rent, or lease\n• Land – Explore residential, agricultural, and commercial land\n• PG – Search for Paying Guest accommodations\n• Commercial – Browse offices, shops, warehouses\n• Vehicles – Buy or sell cars, bikes, and more\n• Other Commodities – Discover products beyond real estate",
    icon: <Navigation className="size-7 text-blue-500" />,
    preferredPosition: "bottom",
    highlight: true,
  },
  {
    id: "auth-buttons",
    targetId: "nav-auth-buttons",
    title: "🔐 Login & Sign Up",
    description:
      "Create an account or log in to unlock the full BhoomiTayi experience!\n\n• Login – Access your existing account, manage listings, and track inquiries\n• Sign Up – Create a free account to post listings, save favorites, and chat with sellers\n\nYou need an account to register services and manage your dashboard.",
    icon: <LogIn className="size-7 text-indigo-500" />,
    preferredPosition: "bottom",
    highlight: true,
  },
  {
    id: "tommy-ai",
    targetId: "tommy-guide-button",
    title: "🐕 Meet Tommy Guide",
    description:
      "Tommy is your page-by-page guide assistant!\n\n• Page Tips – Tommy gives helpful tips specific to each page you visit\n• Step-by-step Guidance – Walks you through forms, listings, and more\n• Always Available – Tommy auto-appears with tips on every page\n• Draggable – Drag Tommy anywhere on the screen\n\nClick Tommy's icon to see tips for the current page!",
    icon: <Eye className="size-7 text-orange-500" />,
    preferredPosition: "top",
    highlight: true,
    avatarSrc: TOMMY_AVATAR,
  },
  {
    id: "language",
    targetId: "language-selector-desktop",
    title: "🌐 Language Selection",
    description:
      "Use the language selector to browse BhoomiTayi in your preferred language.\n\nSupported: English, Kannada, Hindi, Telugu, Malayalam, and Tamil.",
    icon: <Globe className="size-7 text-indigo-500" />,
    preferredPosition: "bottom",
    highlight: true,
  },
  {
    id: "theme",
    targetId: "theme-toggle-desktop",
    title: "🌙 Theme Switcher",
    description:
      "Switch between Light Mode and Dark Mode for a comfortable viewing experience.\n\nYour preference is saved automatically.",
    icon: <Moon className="size-7 text-amber-500" />,
    preferredPosition: "bottom",
    highlight: true,
  },
  {
    id: "search-area",
    targetId: "hero-search-area",
    title: "🎯 Main Search Area",
    description:
      "This is the primary section where you can discover available listings and services across India.\n\nUse BhoomiTayi to:\n• Buy\n• Sell\n• Rent\n• Promote Services\n• Discover Opportunities\n\nall from a single platform.",
    icon: <Search className="size-7 text-cyan-500" />,
    preferredPosition: "bottom",
    highlight: true,
  },
  {
    id: "featured-listings",
    targetId: "featured-listings",
    title: "🌟 Featured Services",
    description:
      "Check out these hand-picked premium listings and services!\n\nFeatured items get priority visibility. When you create your own listings, you can optionally promote them to appear here.",
    icon: <Sparkles className="size-7 text-yellow-500" />,
    preferredPosition: "top",
    highlight: true,
  },
  {
    id: "quick-settings",
    targetId: "settings-widget",
    title: "⚙️ Quick Settings",
    description:
      "Use this floating widget to personalize your experience on BhoomiTayi.\n\n• Adjust font sizes\n• Toggle high contrast mode\n• Reduce motion & animations\n• Switch to compact mode\n\nYour accessibility and display preferences are automatically saved.",
    icon: <Settings className="size-7 text-zinc-500 dark:text-zinc-400" />,
    preferredPosition: "right",
    highlight: true,
  },
  {
    id: "completion",
    targetId: "body",
    title: "🎉 You're Ready!",
    description:
      "You now know the key features of BhoomiTayi.\n\nStart exploring listings or click Register Service to add your own products and services.\n\nYou can always reopen this guide by clicking the help button (?) on the right side.",
    icon: <PartyPopper className="size-7 text-orange-500" />,
    preferredPosition: "center",
    highlight: false,
  },
];

// ─── Position calculator with arrow direction ──────────────────────────────

type ArrowDir = "up" | "down" | "left" | "right" | "none";

interface CardPosition {
  left: number;
  top: number;
  cardWidth: number;
  arrowDir: ArrowDir;
  arrowX: number;
  arrowY: number;
}

function computeCardPosition(
  targetRect: DOMRect | null,
  preferred: TourStep["preferredPosition"],
  ww: number,
  wh: number,
  isMobile: boolean,
  currentCardH: number
): CardPosition {
  const cardW = isMobile ? Math.min(ww - 32, 340) : 370;
  // Enforce a minimum realistic height so the card is never clamped to the very bottom 
  // if ResizeObserver temporarily reports 0 during mount/animations
  const safeCardH = Math.max(currentCardH, 300); 
  const gap = 18;
  const pad = 12;

  // Centered (no target) — use sentinel value -1 so render can apply CSS centering
  if (!targetRect || preferred === "center") {
    return {
      left: -1,
      top: -1,
      cardWidth: cardW,
      arrowDir: "none",
      arrowX: 0,
      arrowY: 0,
    };
  }

  const targetCX = targetRect.left + targetRect.width / 2;
  const targetCY = targetRect.top + targetRect.height / 2;

  // Try each placement: preferred first, then fallbacks
  const placements: Array<"bottom" | "top" | "left" | "right"> = [
    preferred as "bottom" | "top" | "left" | "right",
    "bottom",
    "top",
    "right",
    "left",
  ];

  for (const placement of placements) {
    let left: number, top: number;
    let arrowDir: ArrowDir;
    let arrowX: number, arrowY: number;

    switch (placement) {
      case "bottom":
        left = targetCX - cardW / 2;
        top = targetRect.bottom + gap;
        arrowDir = "up";
        arrowX = targetCX - left;
        arrowY = 0;
        break;
      case "top":
        left = targetCX - cardW / 2;
        top = targetRect.top - safeCardH - gap;
        arrowDir = "down";
        arrowX = targetCX - left;
        arrowY = safeCardH;
        break;
      case "right":
        left = targetRect.right + gap;
        top = targetCY - safeCardH / 2;
        arrowDir = "left";
        arrowX = 0;
        arrowY = targetCY - top;
        break;
      case "left":
        left = targetRect.left - cardW - gap;
        top = targetCY - safeCardH / 2;
        arrowDir = "right";
        arrowX = cardW;
        arrowY = targetCY - top;
        break;
      default:
        left = pad;
        top = pad;
        arrowDir = "none";
        arrowX = 0;
        arrowY = 0;
    }

    // Clamp
    if (left < pad) left = pad;
    if (left + cardW > ww - pad) left = ww - cardW - pad;
    if (top < pad) top = pad;
    if (top + safeCardH > wh - pad) top = wh - safeCardH - pad;

    // Check if the card fits (doesn't overlap the target too much)
    const cardRight = left + cardW;
    const cardBottom = top + safeCardH;
    const overlapX = Math.max(0, Math.min(cardRight, targetRect.right) - Math.max(left, targetRect.left));
    const overlapY = Math.max(0, Math.min(cardBottom, targetRect.bottom) - Math.max(top, targetRect.top));
    const overlap = overlapX * overlapY;

    if (overlap < 100) {
      // Recalculate arrow position after clamping
      arrowX = Math.max(20, Math.min(cardW - 20, targetCX - left));
      if (arrowDir === "left" || arrowDir === "right") {
        arrowY = Math.max(20, Math.min(safeCardH - 20, targetCY - top));
      }
      return { left, top, cardWidth: cardW, arrowDir, arrowX, arrowY };
    }
  }

  // Fallback: center
  return {
    left: Math.max(pad, ww / 2 - cardW / 2),
    top: Math.max(pad, wh / 2 - safeCardH / 2),
    cardWidth: cardW,
    arrowDir: "none",
    arrowX: 0,
    arrowY: 0,
  };
}

// ─── Animated Arrow SVG — points FROM the tooltip card TO the target ───────

function AnimatedArrowToTarget({
  cardLeft,
  cardTop,
  cardWidth,
  cardHeight,
  arrowDir,
  arrowX,
  arrowY,
  targetRect,
}: {
  cardLeft: number;
  cardTop: number;
  cardWidth: number;
  cardHeight: number;
  arrowDir: ArrowDir;
  arrowX: number;
  arrowY: number;
  targetRect: DOMRect | null;
}) {
  if (arrowDir === "none" || !targetRect) return null;

  // Calculate start point (edge of the card) and end point (center of target)
  let startX: number, startY: number;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  switch (arrowDir) {
    case "up": // Card is below target, arrow points up from card top
      startX = cardLeft + arrowX;
      startY = cardTop;
      break;
    case "down": // Card is above target, arrow points down from card bottom
      startX = cardLeft + arrowX;
      startY = cardTop + cardHeight;
      break;
    case "left": // Card is to the right of target, arrow points left
      startX = cardLeft;
      startY = cardTop + arrowY;
      break;
    case "right": // Card is to the left of target, arrow points right
      startX = cardLeft + cardWidth;
      startY = cardTop + arrowY;
      break;
    default:
      startX = cardLeft;
      startY = cardTop;
  }

  // Calculate control points for a smooth curve
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  let cpX: number, cpY: number;
  switch (arrowDir) {
    case "up":
    case "down":
      cpX = midX;
      cpY = startY + (endY - startY) * 0.3;
      break;
    case "left":
    case "right":
      cpX = startX + (endX - startX) * 0.3;
      cpY = midY;
      break;
    default:
      cpX = midX;
      cpY = midY;
  }

  // Arrow head angle
  const angle = Math.atan2(endY - cpY, endX - cpX);
  const headLen = 12;
  const arrowP1X = endX - headLen * Math.cos(angle - Math.PI / 6);
  const arrowP1Y = endY - headLen * Math.sin(angle - Math.PI / 6);
  const arrowP2X = endX - headLen * Math.cos(angle + Math.PI / 6);
  const arrowP2Y = endY - headLen * Math.sin(angle + Math.PI / 6);

  const pathD = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;

  return (
    <svg
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 10001, width: "100vw", height: "100vh" }}
    >
      <defs>
        <linearGradient id="arrow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.9)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.9)" />
        </linearGradient>
        <filter id="arrow-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Main curved line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="url(#arrow-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 4"
        filter="url(#arrow-glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      />

      {/* Arrowhead */}
      <motion.polygon
        points={`${endX},${endY} ${arrowP1X},${arrowP1Y} ${arrowP2X},${arrowP2Y}`}
        fill="url(#arrow-gradient)"
        filter="url(#arrow-glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />

      {/* Pulsing circle at target */}
      <motion.circle
        cx={endX}
        cy={endY}
        r="6"
        fill="none"
        stroke="rgba(59, 130, 246, 0.6)"
        strokeWidth="2"
        initial={{ r: 4, opacity: 1 }}
        animate={{ r: 18, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
    </svg>
  );
}

// ─── Small tooltip arrow (cosmetic triangle at card edge) ──────────────────

function TooltipArrow({
  dir,
  x,
  y,
}: {
  dir: ArrowDir;
  x: number;
  y: number;
  cardW: number;
  cardH: number;
}) {
  if (dir === "none") return null;

  const size = 14;
  let style: React.CSSProperties = { position: "absolute" };
  let points = "";

  switch (dir) {
    case "up":
      style = { ...style, left: x - size, top: -size + 1 };
      points = `${size},0 0,${size} ${size * 2},${size}`;
      break;
    case "down":
      style = { ...style, left: x - size, bottom: -size + 1 };
      points = `0,0 ${size * 2},0 ${size},${size}`;
      break;
    case "left":
      style = { ...style, left: -size + 1, top: y - size };
      points = `0,${size} ${size},0 ${size},${size * 2}`;
      break;
    case "right":
      style = { ...style, right: -size + 1, top: y - size };
      points = `0,0 ${size},${size} 0,${size * 2}`;
      break;
  }

  return (
    <svg
      width={dir === "up" || dir === "down" ? size * 2 : size}
      height={dir === "up" || dir === "down" ? size : size * 2}
      style={style}
      className="pointer-events-none drop-shadow-md"
    >
      <polygon
        points={points}
        className="fill-white dark:fill-zinc-900"
        stroke="rgba(200,200,200,0.3)"
        strokeWidth="1"
      />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function OnboardingTour() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { hasSeenOnboarding, setHasSeenOnboarding } = useSettingsStore();

  const [mounted, setMounted] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: 1024, h: 768 });

  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  const observerRef = useRef<ResizeObserver | null>(null);
  const [cardHeight, setCardHeight] = useState(340);

  // Use a callback ref so we correctly observe the NEW card when AnimatePresence swaps them out
  const cardRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target.clientHeight > 0) {
            setCardHeight(entry.target.clientHeight);
          }
        }
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  // ── Mount & window size ──
  useEffect(() => {
    setMounted(true);
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });

    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Auto-show tour EVERY time the homepage loads/refreshes ──
  useEffect(() => {
    if (!mounted) return;
    if (pathname !== "/") return;
    const timer = setTimeout(() => {
      setIsTourActive(true);
      setCurrentStep(0);
    }, 1500);
    return () => clearTimeout(timer);
  }, [mounted, pathname]);

  // ── Update target rect when step changes ──
  useEffect(() => {
    if (!isTourActive) return;

    const step = TOUR_STEPS[currentStep];
    if (step.targetId === "body" || step.preferredPosition === "center") {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll element into view if not visible
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            setTargetRect(el.getBoundingClientRect());
          }, 400);
        }
      } else {
        setTargetRect(null);
      }
    };

    const initTimer = setTimeout(updateRect, 100);
    // Also re-check after DOM settles (some elements take time to render)
    const settleTimer = setTimeout(updateRect, 500);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(settleTimer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStep, isTourActive]);

  // ── ESC key to close ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isTourActive) handleCompleteTour();
        if (showHelpMenu) setShowHelpMenu(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isTourActive, showHelpMenu]);

  // ── Close help menu on outside click ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        showHelpMenu &&
        helpMenuRef.current &&
        !helpMenuRef.current.contains(e.target as Node) &&
        helpButtonRef.current &&
        !helpButtonRef.current.contains(e.target as Node)
      ) {
        setShowHelpMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showHelpMenu]);

  // ── Actions ──
  const handleCompleteTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentStep(0);
    setTargetRect(null);
    setHasSeenOnboarding(true);
  }, [setHasSeenOnboarding]);

  const handleSkip = useCallback(() => {
    handleCompleteTour();
  }, [handleCompleteTour]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleCompleteTour();
    }
  }, [currentStep, handleCompleteTour]);

  // ── Restart tour — available at any time via the "?" button ──
  const handleStartTour = useCallback(() => {
    setShowHelpMenu(false);
    // Reset progress so tour always starts fresh
    setCurrentStep(0);
    setTargetRect(null);

    if (pathname !== "/") {
      router.push("/");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          setIsTourActive(true);
        }, 500);
      }, 800);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        setIsTourActive(true);
      }, 400);
    }
  }, [pathname, router]);

  if (!mounted) return null;

  const isMobile = windowSize.w < 768;
  const stepData = TOUR_STEPS[currentStep];
  const pos = isTourActive
    ? computeCardPosition(
        targetRect,
        stepData.preferredPosition,
        windowSize.w,
        windowSize.h,
        isMobile,
        cardHeight
      )
    : null;

  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* ─── Tour Overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTourActive && (
          <div
            className="fixed inset-0 z-[9998]"
            role="dialog"
            aria-modal="true"
            aria-label="BhoomiTayi onboarding tour"
          >
            {/* Dimmed overlay — NO blur, just darken */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/50"
              onClick={handleSkip}
            />

            {/* Spotlight cutout — element stays fully clear and visible, NO blur */}
            <AnimatePresence mode="wait">
              {targetRect && stepData.highlight && (
                <motion.div
                  key={`spotlight-${currentStep}`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  className="absolute rounded-xl pointer-events-none"
                  style={{
                    left: targetRect.left - 8,
                    top: targetRect.top - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.50)",
                    border: "2.5px solid rgba(255,255,255,0.8)",
                    background: "transparent",
                    zIndex: 9999,
                  }}
                >
                  {/* Animated glow ring */}
                  <div className="absolute -inset-1.5 rounded-xl border-2 border-blue-400/50 animate-pulse" />
                  <div className="absolute -inset-3 rounded-2xl border border-blue-300/20 animate-pulse" style={{ animationDelay: "0.5s" }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Animated Arrow from Card to Target */}
            <AnimatePresence mode="wait">
              {pos && targetRect && stepData.highlight && (
                <AnimatedArrowToTarget
                  key={`arrow-${currentStep}`}
                  cardLeft={pos.left}
                  cardTop={pos.top}
                  cardWidth={pos.cardWidth}
                  cardHeight={Math.max(cardHeight, 300)}
                  arrowDir={pos.arrowDir}
                  arrowX={pos.arrowX}
                  arrowY={pos.arrowY}
                  targetRect={targetRect}
                />
              )}
            </AnimatePresence>

            {/* Tooltip Card with Arrow */}
            <AnimatePresence mode="wait">
              {pos && (
                pos.left === -1 ? (
                  /* Centered card — use flex wrapper so framer-motion can't break centering */
                  <div
                    className="fixed inset-0 flex items-center justify-center pointer-events-none"
                    style={{ zIndex: 10000 }}
                  >
                    <motion.div
                      key={`card-${currentStep}`}
                      ref={cardRefCallback}
                      initial={{ opacity: 0, y: 30, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 15 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 200,
                      }}
                      className="pointer-events-auto"
                      style={{ width: pos.cardWidth }}
                    >
                      <div className="rounded-[2rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent pointer-events-none" />
                        {/* Gradient top border */}
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                        {/* Close button */}
                        <button
                          onClick={handleSkip}
                          className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          aria-label="Close tour"
                        >
                          <X className="size-4 text-zinc-400" />
                        </button>

                        <div className="p-5">
                          <div className="flex flex-col items-center text-center space-y-3">
                            {/* Avatar image or Icon */}
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                damping: 15,
                                stiffness: 200,
                                delay: 0.1,
                              }}
                            >
                              {stepData.avatarSrc ? (
                                <div className="size-16 rounded-full overflow-hidden ring-3 ring-blue-200 dark:ring-blue-800 shadow-lg">
                                  <Image
                                    src={stepData.avatarSrc}
                                    alt={stepData.title}
                                    width={64}
                                    height={64}
                                    className="size-full object-cover"
                                  />
                                </div>
                              ) : stepData.isLogo ? (
                                <div className="flex items-center justify-center">
                                  {stepData.icon}
                                </div>
                              ) : (
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                                  {stepData.icon}
                                </div>
                              )}
                            </motion.div>

                            {/* Title */}
                            <h3 className="text-lg font-bold bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent leading-tight">
                              {stepData.title}
                            </h3>

                            {/* Description - scrollable */}
                            <div className="max-h-36 overflow-y-auto w-full pr-1">
                              <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line text-left">
                                {stepData.description}
                              </p>
                            </div>
                          </div>

                          {/* Footer: Progress + Navigation */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            {/* Progress dots */}
                            <div className="flex gap-1">
                              {TOUR_STEPS.map((_, i) => (
                                <motion.div
                                  key={i}
                                  animate={{
                                    width: i === currentStep ? 18 : 5,
                                    backgroundColor:
                                      i === currentStep
                                        ? "rgb(59, 130, 246)"
                                        : i < currentStep
                                        ? "rgb(147, 197, 253)"
                                        : "rgb(228, 228, 231)",
                                  }}
                                  className="h-1.5 rounded-full"
                                  transition={{ duration: 0.3 }}
                                />
                              ))}
                            </div>

                            {/* Nav buttons */}
                            <div className="flex items-center gap-1.5">
                              {/* Previous button */}
                              {currentStep > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleBack}
                                  className="rounded-xl h-8 text-xs px-2"
                                  aria-label="Previous step"
                                >
                                  <ChevronLeft className="size-3.5 mr-0.5" />
                                  Prev
                                </Button>
                              )}

                              {/* Skip Tour button (shown on step 0) */}
                              {isFirstStep && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSkip}
                                  className="rounded-xl h-8 text-xs text-zinc-500 px-2"
                                  aria-label="Skip tour"
                                >
                                  Skip
                                </Button>
                              )}

                              {/* Skip Tour button (shown mid-tour) */}
                              {!isFirstStep && !isLastStep && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSkip}
                                  className="rounded-xl h-8 text-xs text-zinc-400 px-2"
                                  aria-label="Skip tour"
                                >
                                  Skip Tour
                                </Button>
                              )}

                              {/* Next / Finish button */}
                              <Button
                                size="sm"
                                onClick={handleNext}
                                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20 h-8 text-xs font-semibold px-3"
                                aria-label={isLastStep ? "Finish tour" : "Next step"}
                              >
                                {isFirstStep
                                  ? "Start Tour"
                                  : isLastStep
                                  ? "Finish"
                                  : "Next"}
                                <ChevronRight className="size-3.5 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  /* Targeted card — absolute positioned near the target element */
                  <motion.div
                    key={`card-${currentStep}`}
                    ref={cardRefCallback}
                    initial={{ opacity: 0, y: 20, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 10 }}
                    transition={{
                      type: "spring",
                      damping: 25,
                      stiffness: 200,
                    }}
                    className="absolute"
                    style={{
                      left: pos.left,
                      top: pos.top,
                      width: pos.cardWidth,
                      zIndex: 10000,
                    }}
                  >
                    {/* Small cosmetic arrow triangle at card edge */}
                    <TooltipArrow
                      dir={pos.arrowDir}
                      x={pos.arrowX}
                      y={pos.arrowY}
                      cardW={pos.cardWidth}
                      cardH={cardHeight}
                    />

                    <div className="rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
                      {/* Gradient top border */}
                      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                      {/* Close button */}
                      <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Close tour"
                      >
                        <X className="size-4 text-zinc-400" />
                      </button>

                      <div className="p-5">
                        <div className="flex flex-col items-center text-center space-y-3">
                          {/* Avatar image or Icon */}
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              damping: 15,
                              stiffness: 200,
                              delay: 0.1,
                            }}
                          >
                            {stepData.avatarSrc ? (
                              <div className="size-16 rounded-full overflow-hidden ring-3 ring-blue-200 dark:ring-blue-800 shadow-lg">
                                <Image
                                  src={stepData.avatarSrc}
                                  alt={stepData.title}
                                  width={64}
                                  height={64}
                                  className="size-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                                {stepData.icon}
                              </div>
                            )}
                          </motion.div>

                          {/* Title */}
                          <h3 className="text-lg font-bold bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent leading-tight">
                            {stepData.title}
                          </h3>

                          {/* Description - scrollable */}
                          <div className="max-h-36 overflow-y-auto w-full pr-1">
                            <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line text-left">
                              {stepData.description}
                            </p>
                          </div>
                        </div>

                        {/* Footer: Progress + Navigation */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                          {/* Progress dots */}
                          <div className="flex gap-1">
                            {TOUR_STEPS.map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{
                                  width: i === currentStep ? 18 : 5,
                                  backgroundColor:
                                    i === currentStep
                                      ? "rgb(59, 130, 246)"
                                      : i < currentStep
                                      ? "rgb(147, 197, 253)"
                                      : "rgb(228, 228, 231)",
                                }}
                                className="h-1.5 rounded-full"
                                transition={{ duration: 0.3 }}
                              />
                            ))}
                          </div>

                          {/* Nav buttons */}
                          <div className="flex items-center gap-1.5">
                            {/* Previous button */}
                            {currentStep > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="rounded-xl h-8 text-xs px-2"
                                aria-label="Previous step"
                              >
                                <ChevronLeft className="size-3.5 mr-0.5" />
                                Prev
                              </Button>
                            )}

                            {/* Skip Tour button (shown on step 0) */}
                            {isFirstStep && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSkip}
                                className="rounded-xl h-8 text-xs text-zinc-500 px-2"
                                aria-label="Skip tour"
                              >
                                Skip
                              </Button>
                            )}

                            {/* Skip Tour button (shown mid-tour) */}
                            {!isFirstStep && !isLastStep && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSkip}
                                className="rounded-xl h-8 text-xs text-zinc-400 px-2"
                                aria-label="Skip tour"
                              >
                                Skip Tour
                              </Button>
                            )}

                            {/* Next / Finish button */}
                            <Button
                              size="sm"
                              onClick={handleNext}
                              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20 h-8 text-xs font-semibold px-3"
                              aria-label={isLastStep ? "Finish tour" : "Next step"}
                            >
                              {isFirstStep
                                ? "Start Tour"
                                : isLastStep
                                ? "Finish"
                                : "Next"}
                              <ChevronRight className="size-3.5 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Floating Help Button — right side, middle-right above Bella AI ─── */}
      {!isTourActive && (
        <div
          className="fixed z-[55]"
          style={{
            right: isMobile ? "16px" : "20px",
            // Position in middle-right area, above Bella AI
            // Bella AI is typically fixed at bottom-right; we place the "?" button above it
            bottom: isMobile ? "120px" : "140px",
          }}
          id="onboarding-help-btn"
        >
          {/* Restart Tour FAB */}
          <motion.button
            ref={helpButtonRef}
            onClick={handleStartTour}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative size-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center justify-center transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            aria-label="Restart onboarding tour"
            title="Restart Tour"
          >
            <HelpCircle className="size-5" />
            {/* Tooltip label */}
            <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-lg bg-zinc-900 dark:bg-white px-2 py-1 text-[10px] font-semibold text-white dark:text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block shadow-lg">
              Restart Tour
            </span>
          </motion.button>
        </div>
      )}
    </>
  );
}
