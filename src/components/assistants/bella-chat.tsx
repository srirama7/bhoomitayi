"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, User, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettingsStore, type SiteSettings } from "@/lib/settings-store";
import { useAuthStore } from "@/lib/store";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const BELLA_AVATAR = "/bella-avatar.jpg";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Handwritten AI Engine with Firebase Data Control ─────────────────────────────

interface Intent {
  patterns: RegExp[];
  responseKey?: string;
  resolver?: (message: string) => Promise<string>;
  action?: () => void;
}

function createBellaEngine(
  setTheme: (t: string) => void,
  changeLanguage: (l: string) => void,
  settings: SiteSettings,
  user: any | null,
  t: (key: string) => string,
  router: any
) {
  const intents: Intent[] = [
    // ── Settings: Theme ──
    {
      patterns: [/dark\s*mode/i, /turn.*dark/i, /switch.*dark/i, /enable.*dark/i, /make.*dark/i, /go\s*dark/i, /डार्क/i, /ಡಾರ್ಕ್/i, /డార్క్/i, /ഡാർക്ക്/i, /டார்க்/i],
      responseKey: "bella.dark_mode_done",
      action: () => setTheme("dark"),
    },
    {
      patterns: [/light\s*mode/i, /turn.*light/i, /switch.*light/i, /enable.*light/i, /make.*light/i, /go\s*light/i, /लाइट/i, /ಲೈಟ್/i, /లైట్/i, /ലൈറ്റ്/i, /லைட்/i],
      responseKey: "bella.light_mode_done",
      action: () => setTheme("light"),
    },
    {
      patterns: [/system\s*(mode|theme)/i, /auto\s*(mode|theme)/i, /default\s*theme/i],
      responseKey: "bella.system_mode_done",
      action: () => setTheme("system"),
    },
    // ── Settings: Website Control ──
    {
      patterns: [/open.*settings/i, /show.*settings/i, /go.*settings/i],
      resolver: async () => {
        settings.setSettingsOpen(true);
        return "I've opened the Quick Settings menu for you!";
      }
    },
    {
      patterns: [/close.*settings/i, /hide.*settings/i],
      resolver: async () => {
        settings.setSettingsOpen(false);
        return "I've closed the settings menu.";
      }
    },
    {
      patterns: [/compact\s*mode\s*on/i, /enable.*compact/i],
      resolver: async () => {
        settings.setCompactMode(true);
        return "Compact mode enabled! The layout is now tighter.";
      }
    },
    {
      patterns: [/compact\s*mode\s*off/i, /disable.*compact/i],
      resolver: async () => {
        settings.setCompactMode(false);
        return "Compact mode disabled! The layout is back to normal.";
      }
    },
    {
      patterns: [/high\s*contrast\s*on/i, /enable.*contrast/i],
      resolver: async () => {
        settings.setHighContrast(true);
        return "High contrast mode enabled! Text is now more readable.";
      }
    },
    {
      patterns: [/high\s*contrast\s*off/i, /disable.*contrast/i],
      resolver: async () => {
        settings.setHighContrast(false);
        return "High contrast mode disabled.";
      }
    },
    // ── Navigation Control ──
    {
      patterns: [/go.*home/i, /open.*home/i, /take.*home/i],
      resolver: async () => {
        router.push("/");
        return "Taking you to the homepage!";
      }
    },
    {
      patterns: [/go.*dashboard/i, /open.*dashboard/i, /my\s*profile/i],
      resolver: async () => {
        router.push("/dashboard");
        return "Opening your dashboard...";
      }
    },
    {
      patterns: [/go.*sell/i, /open.*sell/i, /i\s*want\s*to\s*sell/i, /register.*service/i],
      resolver: async () => {
        router.push("/sell");
        return "Opening the Register Service page. Let's list your property!";
      }
    },
    // ── Firebase Data: Global Stats ──
    {
      patterns: [/how\s*many.*listings/i, /total.*properties/i, /total.*listings/i, /website.*stats/i],
      resolver: async () => {
        if (!db) return "I'm sorry, I can't access the database right now because it hasn't been configured.";
        try {
          const q = query(collection(db, "listings"), where("status", "==", "active"));
          const snapshot = await getDocs(q);
          const count = snapshot.size;
          return `There are currently ${count} active listings live on BhoomiTayi! We have properties in Houses, Land, PG, Commercial, and more.`;
        } catch {
          return "I'm having a little trouble accessing the database right now, but we have many amazing properties available!";
        }
      },
    },
    // ── Firebase Data: Latest Listings ──
    {
      patterns: [/show.*latest/i, /recent.*listings/i, /new.*properties/i, /what.*new/i],
      resolver: async () => {
        if (!db) return "Database access is currently unavailable.";
        try {
          const q = query(
            collection(db, "listings"), 
            where("status", "==", "active"),
            orderBy("created_at", "desc"),
            limit(3)
          );
          const snap = await getDocs(q);
          if (snap.empty) return "No new listings found recently.";
          
          let resp = "Here are the 3 most recent listings:\n";
          snap.forEach(doc => {
            const data = doc.data();
            resp += `\n🏠 ${data.title} - ₹${data.price.toLocaleString('en-IN')}\n📍 ${data.address}\n`;
          });
          return resp + "\nGo to the sections above to see more!";
        } catch (e) {
          console.error(e);
          return "I couldn't fetch the latest listings right now. Please check our home page for the newest updates!";
        }
      },
    },
    // ── Firebase Data: User's Own Listings ──
    {
      patterns: [/my\s*listings/i, /how\s*many\s*do\s*i\s*have/i, /show\s*my\s*posts/i],
      resolver: async () => {
        if (!db) return "Database access is currently unavailable.";
        if (!user) return "You need to log in to see your listings! Click the User icon in the top right.";
        try {
          const q = query(collection(db, "listings"), where("user_id", "==", user.uid));
          const snap = await getDocs(q);
          const count = snap.size;
          if (count === 0) return "You haven't posted any listings yet. Ready to sell? Click 'Register Service'!";
          
          let resp = `You have ${count} listings in your account. Here are your most recent ones:\n`;
          const recentSnap = query(collection(db, "listings"), where("user_id", "==", user.uid), orderBy("created_at", "desc"), limit(3));
          const recentDocs = await getDocs(recentSnap);
          recentDocs.forEach(doc => {
            const data = doc.data();
            resp += `\n- ${data.title} (${data.status})`;
          });
          return resp + "\n\nYou can manage them all in your Dashboard > My Listings.";
        } catch {
          return "I encountered an error fetching your data. Are you logged in correctly?";
        }
      },
    },
    // ── Firebase Data: Specific Category ──
    {
      patterns: [/how\s*many\s*(houses|homes)/i, /show.*houses/i],
      resolver: async () => {
        if (!db) return "Database access is currently unavailable.";
        const q = query(collection(db, "listings"), where("category", "==", "house"), where("status", "==", "active"));
        const snap = await getDocs(q);
        return `We have ${snap.size} houses currently available for sale or rent. Check the 'Houses' section in the menu to see them!`;
      }
    },
    {
      patterns: [/how\s*many\s*lands/i, /show.*land/i, /plots\s*available/i],
      resolver: async () => {
        if (!db) return "Database access is currently unavailable.";
        const q = query(collection(db, "listings"), where("category", "==", "land"), where("status", "==", "active"));
        const snap = await getDocs(q);
        return `There are ${snap.size} land plots/sites available right now. You can find residential and agricultural land in our 'Land' section.`;
      }
    },
    // ── Settings: Reading Mode ──
    {
      patterns: [/reading\s*mode\s*on/i, /turn.*reading/i, /enable.*reading/i, /start.*reading/i, /reading\s*mode/i],
      responseKey: "bella.reading_on",
      action: () => settings.setReadingMode(true),
    },
    {
      patterns: [/reading\s*mode\s*off/i, /disable.*reading/i, /stop.*reading/i, /no.*reading/i, /exit.*reading/i],
      responseKey: "bella.reading_off",
      action: () => settings.setReadingMode(false),
    },
    // ── Settings: High Contrast ──
    {
      patterns: [/high\s*contrast\s*on/i, /turn.*contrast/i, /enable.*contrast/i, /more\s*contrast/i, /high\s*contrast/i],
      responseKey: "bella.contrast_on",
      action: () => settings.setHighContrast(true),
    },
    {
      patterns: [/contrast\s*off/i, /disable.*contrast/i, /normal\s*contrast/i, /low\s*contrast/i],
      responseKey: "bella.contrast_off",
      action: () => settings.setHighContrast(false),
    },
    // ── Settings: Font Size ──
    {
      patterns: [/font\s*(size)?\s*small/i, /smaller\s*(text|font)/i, /decrease.*font/i, /text\s*small/i],
      responseKey: "bella.font_small",
      action: () => settings.setFontSize("small"),
    },
    {
      patterns: [/font\s*(size)?\s*medium/i, /normal\s*(text|font|size)/i, /default\s*(text|font|size)/i, /reset.*font/i],
      responseKey: "bella.font_medium",
      action: () => settings.setFontSize("medium"),
    },
    {
      patterns: [/font\s*(size)?\s*large/i, /bigger\s*(text|font)/i, /increase.*font/i, /text\s*large/i, /large\s*text/i, /larger/i],
      responseKey: "bella.font_large",
      action: () => settings.setFontSize("large"),
    },
    {
      patterns: [/font\s*(size)?\s*(extra|x)\s*large/i, /biggest\s*(text|font)/i, /very\s*large/i, /xlarge/i, /extra\s*large/i],
      responseKey: "bella.font_xlarge",
      action: () => settings.setFontSize("xlarge"),
    },
    // ── Settings: Reduce Animations ──
    {
      patterns: [/reduce.*anim/i, /stop.*anim/i, /disable.*anim/i, /no.*anim/i, /less.*motion/i, /animation.*off/i],
      responseKey: "bella.animations_off",
      action: () => settings.setReduceAnimations(true),
    },
    {
      patterns: [/enable.*anim/i, /restore.*anim/i, /animation.*on/i, /more.*motion/i, /turn.*anim.*on/i],
      responseKey: "bella.animations_on",
      action: () => settings.setReduceAnimations(false),
    },
    // ── Settings: Compact Mode ──
    {
      patterns: [/compact\s*mode/i, /enable.*compact/i, /tight.*spacing/i, /compact.*on/i],
      responseKey: "bella.compact_on",
      action: () => settings.setCompactMode(true),
    },
    {
      patterns: [/compact.*off/i, /disable.*compact/i, /normal.*spacing/i, /spacious/i],
      responseKey: "bella.compact_off",
      action: () => settings.setCompactMode(false),
    },
    // ── Settings: Notifications ──
    {
      patterns: [/notification.*on/i, /enable.*notification/i, /email.*notification.*on/i],
      responseKey: "bella.notifications_on",
      action: () => settings.setEmailNotifications(true),
    },
    {
      patterns: [/notification.*off/i, /disable.*notification/i, /email.*notification.*off/i],
      responseKey: "bella.notifications_off",
      action: () => settings.setEmailNotifications(false),
    },
    {
      patterns: [/inquiry.*alert.*on/i, /enable.*inquiry/i],
      responseKey: "bella.inquiry_on",
      action: () => settings.setInquiryAlerts(true),
    },
    {
      patterns: [/inquiry.*alert.*off/i, /disable.*inquiry/i],
      responseKey: "bella.inquiry_off",
      action: () => settings.setInquiryAlerts(false),
    },
    {
      patterns: [/marketing.*on/i, /enable.*marketing/i],
      responseKey: "bella.marketing_on",
      action: () => settings.setMarketingEmails(true),
    },
    {
      patterns: [/marketing.*off/i, /disable.*marketing/i],
      responseKey: "bella.marketing_off",
      action: () => settings.setMarketingEmails(false),
    },
    // ── Settings: Language ──
    {
      patterns: [/english/i, /lang.*en/i, /switch.*english/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("en"),
    },
    {
      patterns: [/kannada/i, /kannad/i, /lang.*kn/i, /ಕನ್ನಡ/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("kn"),
    },
    {
      patterns: [/hindi/i, /lang.*hi/i, /हिंदी/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("hi"),
    },
    {
      patterns: [/telugu/i, /lang.*te/i, /తెలుగు/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("te"),
    },
    {
      patterns: [/malayalam/i, /lang.*ml/i, /മലയാളം/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("ml"),
    },
    {
      patterns: [/tamil/i, /lang.*ta/i, /தமிழ்/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("ta"),
    },
    // ── Settings: Reset ──
    {
      patterns: [/reset.*settings/i, /default.*settings/i, /restore.*defaults/i, /reset\s*all/i],
      responseKey: "bella.reset_done",
      action: () => { settings.resetAll(); setTheme("system"); },
    },
    // ── Settings: Smart Tools (Calculators) ──
    {
      patterns: [/open.*emi/i, /emi.*calc/i, /loan.*calc/i, /calculate.*emi/i, /mortgage.*calc/i],
      resolver: async () => { 
        settings.setActiveCalculator("emi"); 
        return "I've opened the EMI Calculator for you! You can use it to calculate your monthly loan payments."; 
      }
    },
    {
      patterns: [/open.*roi/i, /yield.*calc/i, /roi.*calc/i, /return.*calc/i, /calculate.*roi/i],
      resolver: async () => { 
        settings.setActiveCalculator("roi"); 
        return "I've opened the ROI / Rental Yield Calculator for you. Let's see your investment returns!"; 
      }
    },
    {
      patterns: [/open.*stamp/i, /stamp.*duty/i, /registration.*calc/i, /calculate.*stamp/i],
      resolver: async () => { 
        settings.setActiveCalculator("stamp"); 
        return "I've opened the Stamp Duty & Registration Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*afford/i, /affordability/i, /how.*much.*can.*i.*afford/i, /budget.*calc/i],
      resolver: async () => { 
        settings.setActiveCalculator("afford"); 
        return "I've opened the Affordability Calculator! Put in your income to see how much home you can afford."; 
      }
    },
    {
      patterns: [/open.*area/i, /area.*convert/i, /land.*convert/i, /unit.*convert/i, /sqft.*to/i, /acres.*to/i],
      resolver: async () => { 
        settings.setActiveCalculator("area"); 
        return "I've opened the Land Area Converter for you. You can convert between SqFt, Acres, Guntas, Cents, and Hectares!"; 
      }
    },
    {
      patterns: [/open.*scientific/i, /math.*calc/i, /scientific/i],
      resolver: async () => { 
        settings.setActiveCalculator("scientific"); 
        return "I've opened the Scientific Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*currency/i, /money.*convert/i, /exchange.*rate/i, /currency/i],
      resolver: async () => { 
        settings.setActiveCalculator("currency"); 
        return "I've opened the Currency Converter! Note that these are estimated rates."; 
      }
    },
    {
      patterns: [/open.*measure/i, /length/i, /distance/i, /how.*long/i, /meters.*to/i, /km.*to/i, /miles.*to/i],
      resolver: async () => { 
        settings.setActiveCalculator("measure"); 
        return "I've opened the Length & Measurements Converter for you."; 
      }
    },
    {
      patterns: [/open.*volume/i, /liters/i, /gallons/i, /liquid/i, /capacity/i],
      resolver: async () => { 
        settings.setActiveCalculator("volume"); 
        return "I've opened the Volume Converter for you!"; 
      }
    },
    {
      patterns: [/open.*weight/i, /mass/i, /kg.*to/i, /lbs.*to/i, /pounds/i],
      resolver: async () => { 
        settings.setActiveCalculator("weight"); 
        return "I've opened the Weight Converter for you!"; 
      }
    },
    {
      patterns: [/open.*temp/i, /celsius/i, /fahrenheit/i, /hot/i, /cold/i, /weather.*calc/i],
      resolver: async () => { 
        settings.setActiveCalculator("temp"); 
        return "I've opened the Temperature Converter for you!"; 
      }
    },
    {
      patterns: [/open.*speed/i, /velocity/i, /mph.*to/i, /kmh.*to/i, /how.*fast/i],
      resolver: async () => { 
        settings.setActiveCalculator("speed"); 
        return "I've opened the Speed Converter for you!"; 
      }
    },
    {
      patterns: [/open.*time/i, /duration/i, /hours.*to/i, /minutes.*to/i, /seconds/i],
      resolver: async () => { 
        settings.setActiveCalculator("time"); 
        return "I've opened the Time Converter for you!"; 
      }
    },
    {
      patterns: [/open.*sip/i, /investment.*calc/i, /mutual.*fund/i, /sip.*calc/i, /return.*on.*investment/i],
      resolver: async () => { 
        settings.setActiveCalculator("sip"); 
        return "I've opened the SIP Investment Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*tax/i, /income.*tax/i, /deduction/i, /tax.*calc/i],
      resolver: async () => { 
        settings.setActiveCalculator("tax"); 
        return "I've opened the Income Tax Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*retire/i, /retirement/i, /corpus/i, /pension/i],
      resolver: async () => { 
        settings.setActiveCalculator("retirement"); 
        return "I've opened the Retirement Planner for you!"; 
      }
    },
    {
      patterns: [/open.*margin/i, /profit/i, /margin.*calc/i, /gross.*margin/i],
      resolver: async () => { 
        settings.setActiveCalculator("margin"); 
        return "I've opened the Profit Margin Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*discount/i, /sale.*price/i, /discount.*calc/i],
      resolver: async () => { 
        settings.setActiveCalculator("discount"); 
        return "I've opened the Discount Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*gst/i, /sales.*tax/i, /gst.*calc/i],
      resolver: async () => { 
        settings.setActiveCalculator("gst"); 
        return "I've opened the GST / Sales Tax Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*break.*even/i, /breakeven/i, /break-even/i],
      resolver: async () => { 
        settings.setActiveCalculator("breakeven"); 
        return "I've opened the Break-even Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*age/i, /how.*old/i, /age.*calc/i],
      resolver: async () => { 
        settings.setActiveCalculator("age"); 
        return "I've opened the Age Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*date.*diff/i, /date.*duration/i, /how.*many.*days/i, /date.*calc/i],
      resolver: async () => { 
        settings.setActiveCalculator("datediff"); 
        return "I've opened the Date Difference / Duration Calculator for you!"; 
      }
    },
    {
      patterns: [/open.*calculator/i, /show.*calculator/i, /all.*calculator/i, /smart.*tools/i, /business.*calc/i, /date.*calc/i],
      resolver: async () => { 
        return "We have many calculators! Which one would you like?\n\nReal Estate & Finance:\n- EMI Calculator\n- ROI Calculator\n- Stamp Duty\n- Affordability\n- Land Area\n- SIP Investment\n- Income Tax\n- Retirement\n\nBusiness:\n- Profit Margin\n- Discount\n- GST / Sales Tax\n- Break-even\n\nDate & Time:\n- Age Calculator\n- Date Difference\n\nGeneral:\n- Scientific\n- Currency\n- Length\n- Volume\n- Weight\n- Temp\n- Speed\n- Time\n\nJust tell me which one!"; 
      }
    },
    // ── Settings: What can you control ──
    {
      patterns: [/what.*can.*control/i, /what.*settings/i, /what.*can.*change/i, /settings.*commands/i, /commands/i],
      responseKey: "_commands",
    },
    // ── Greetings ──
    {
      patterns: [/^hello/i, /^hey/i, /^good\s*(morning|afternoon|evening)/i, /^hi\b/i, /^hii/i, /^hola/i, /^namaste/i, /^namaskar/i],
      responseKey: "_greeting",
    },
    // ── About BhoomiTayi ──
    {
      patterns: [/what.*is.*bhoomitayi/i, /about.*bhoomitayi/i, /tell.*about.*bhoomitayi/i, /bhoomitayi.*kya/i, /ಭೂಮಿತಾಯಿ/i, /భూమితాయి/i, /ഭൂമിതായി/i, /பூமிதாயி/i, /भूमितायी/i],
      responseKey: "_about_bhoomitayi",
    },
    // ── Property Help ──
    {
      patterns: [/house/i, /home/i, /flat/i, /apartment/i, /villa/i, /bhk/i, /मकान/i, /ಮನೆ/i, /ఇల్లు/i, /വീട്/i, /வீடு/i],
      responseKey: "_houses",
    },
    {
      patterns: [/land/i, /plot/i, /site/i, /acre/i, /ज़मीन/i, /ಭೂಮಿ/i, /భూమి/i, /ഭൂമി/i, /நிலம்/i],
      responseKey: "_land",
    },
    {
      patterns: [/pg/i, /paying\s*guest/i, /hostel/i, /room\s*(for|to)\s*rent/i],
      responseKey: "_pg",
    },
    {
      patterns: [/commercial/i, /office/i, /shop/i, /warehouse/i, /showroom/i],
      responseKey: "_commercial",
    },
    {
      patterns: [/vehicle/i, /car/i, /bike/i, /scooter/i, /truck/i, /वाहन/i, /ವಾಹನ/i, /వాహన/i, /വാഹന/i, /வாகன/i],
      responseKey: "_vehicles",
    },
    // ── Tommy's Enhanced Knowledge ──
    {
      patterns: [/how.*list/i, /create.*listing/i, /post.*property/i, /steps.*sell/i],
      responseKey: "_list_guide",
    },
    {
      patterns: [/negotiat/i, /bargain/i, /closing.*deal/i, /offer/i],
      responseKey: "_negotiation",
    },
    {
      patterns: [/market.*analysis/i, /trends/i, /demand/i, /supply/i, /insight/i],
      responseKey: "_market",
    },
    {
      patterns: [/photography/i, /photo.*tips/i, /camera/i, /take.*pictures/i],
      responseKey: "_photography",
    },
    {
      patterns: [/timing/i, /when.*sell/i, /best.*time/i, /season/i],
      responseKey: "_timing",
    },
    {
      patterns: [/description/i, /write.*title/i, /compelling/i, /hook/i],
      responseKey: "_description_guide",
    },
    // ── Original Property Help ──
    {
      patterns: [/sell/i, /register.*service/i],
      responseKey: "_sell",
    },
    {
      patterns: [/price/i, /cost/i, /rate/i, /budget/i, /afford/i, /cheap/i, /expensive/i],
      responseKey: "_price",
    },
    {
      patterns: [/loan/i, /emi/i, /finance/i, /mortgage/i, /bank/i],
      responseKey: "_loan",
    },
    {
      patterns: [/document/i, /paper/i, /khata/i, /deed/i, /ec\b/i, /encumbrance/i],
      responseKey: "_documents",
    },
    // ── Help ──
    {
      patterns: [/help/i, /what can you/i, /features/i, /what do you/i, /how.*use/i, /मदद/i, /ಸಹಾಯ/i, /సహాయం/i, /സഹായം/i, /உதவி/i],
      responseKey: "_help",
    },
    // ── Fun ──
    {
      patterns: [/thank/i, /thanks/i, /thx/i, /धन्यवाद/i, /ಧನ್ಯವಾದ/i, /ధన్యవాదాలు/i, /നന്ദി/i, /நன்றி/i],
      responseKey: "_thanks",
    },
    {
      patterns: [/bye/i, /goodbye/i, /see ya/i, /later/i],
      responseKey: "_bye",
    },
    {
      patterns: [/who.*are.*you/i, /your.*name/i, /about.*you/i],
      responseKey: "_about_bella",
    },
  ];

  return intents;
}

// Static knowledge responses (these are long and stay English but can be extended)
const KNOWLEDGE_RESPONSES: Record<string, string> = {
  _commands: "I can control all these settings for you! Just say:\n\nSmart Tools: 'open emi calc', 'open roi calc', 'stamp duty', 'affordability', 'area converter', 'sip calc', 'tax calc', 'retirement calc'\n\nBusiness: 'profit margin', 'discount calc', 'gst calc', 'break even'\n\nDate/Time: 'age calc', 'date difference'\n\nGeneral Calcs: 'scientific', 'currency converter', 'volume', 'measurements', 'weight', 'temperature', 'speed', 'time'\n\nTheme: 'dark mode' / 'light mode' / 'system mode'\n\nDisplay: 'reading mode', 'high contrast', 'compact mode', 'reduce animations'\n\nFont: 'font small/medium/large/extra large'\n\nLanguage: 'English/Kannada/Hindi/Telugu/Malayalam/Tamil'\n\nNotifications: 'notification on/off'\n\nOther: 'reset settings'",
  _greeting: "Hello! I'm Bella, your smarter real estate assistant! I've learned everything from Tommy and now I can help you with:\n\n- Full Listing Guides (type 'how to list')\n- Smart Tools & Calculators (EMI, SIP, Tax, Scientific, Currency, Margin, GST, Age, etc)\n- Pricing & Negotiation Tips\n- Photography & Description advice\n- Market Trends & Timing\n- Control Website Settings\n- Find properties & more\n\nWhat can I help you with today?",
  _about_bhoomitayi: "BhoomiTayi is India's trusted online marketplace! Here's what we offer:\n\n- Houses: Buy, sell, or rent apartments, villas & independent homes\n- Land: Residential, commercial & agricultural plots\n- PG: Affordable paying guest accommodations\n- Commercial: Office spaces, shops & warehouses\n- Vehicles: Cars, bikes, trucks & more\n- Commodities: Electronics, furniture & miscellaneous\n\nWe serve users across India with verified listings, secure payments, and direct seller connections. Our platform supports 6 languages: English, Kannada, Hindi, Telugu, Malayalam & Tamil.\n\nRegistration is free and listings go live immediately!",
  _houses: "Looking for a house? Here's how:\n\n1. Go to the Houses section from the menu\n2. Browse listings or use search to filter\n3. Click on a listing for full details & photos\n4. Hit 'Send Inquiry' to contact the seller\n\nKey things to check:\n- Location & neighborhood safety\n- Legal documents (Khata, EC, Sale Deed)\n- Water & electricity supply\n- Parking & amenities\n- Compare price per sq.ft with nearby properties",
  _land: "Land investment tips:\n\n1. Browse the Land section\n2. Check plot dimensions & total area\n3. Verify Khata type (A Khata is best)\n4. Visit the site in person\n5. Get EC (Encumbrance Certificate) verified\n\nImportant checks:\n- Clear title deed & ownership chain\n- No encumbrances or legal disputes\n- Proper road access\n- Zoning regulations\n- BBMP/BDA approval status",
  _pg: "PG hunting guide:\n\n1. Check the PG section for listings\n2. Filter by your preferred area & budget\n3. Compare amenities (food, WiFi, laundry)\n4. Visit and check the room condition\n5. Confirm rent, deposit & house rules\n\nPro tips:\n- Visit during meal times to check food quality\n- Ask about guest/visitor policies\n- Check water & power backup",
  _commercial: "Commercial space guide:\n\n1. Browse Commercial section\n2. Check carpet area vs super built-up\n3. Visit during business hours to check foot traffic\n4. Review lease terms carefully\n\nKey factors:\n- Parking availability\n- Power backup & internet\n- Fire safety & emergency exits\n- Proximity to public transport",
  _vehicles: "Vehicle buying guide:\n\n1. Browse the Vehicles section\n2. Check year, KMs driven & number of owners\n3. Verify RC, insurance & pollution certificate\n4. Request a test drive\n5. Negotiate price based on condition",
  _list_guide: "COMPLETE LISTING GUIDE - Follow these steps exactly:\n\nStep 1: Go to Homepage\n- Click the green 'Register Service' button in the top navbar\n- Or go to Menu > Register Service on mobile\n\nStep 2: Select Category\n- House/Apartment, Land, PG, Commercial, Vehicle, or Commodity\n\nStep 3: Fill Details\n- Title: Catchy & clear (e.g., '3BHK Villa near JP Nagar')\n- Description: Write 100+ words covering all features\n- Price: Set competitive price\n\nStep 4: Upload Photos\n- Click 'Upload Images' and select 6-10 high quality photos\n\nStep 5: Review & Submit\n- Your listing goes live immediately!",
  _negotiation: "NEGOTIATION PLAYBOOK:\n\n1. Preparation: Know your MINIMUM acceptable price.\n2. Preparation: Highlight 5 unique selling points.\n3. Handling Offers: Never accept the first offer immediately.\n4. Counter: Move in small increments (1-2% at a time).\n5. Closing: Get TOKEN ADVANCE (1-2% of price) immediately in writing.\n\nGolden Rule: Never show desperation. The right buyer will come!",
  _market: "MARKET ANALYSIS 2026:\n\n- Demand: Tier-1 cities are seeing 8-12% growth.\n- Best appreciation: Land prices are rising fastest at 10-15% YoY.\n- Seasonal Strategy: Oct-Jan (Festival season) is the highest activity period.\n- Track: If you get 3-5 inquiries/week, your pricing is perfect!",
  _photography: "PHOTOGRAPHY GUIDE:\n\n1. Prepare: Deep clean every room and remove clutter.\n2. Lighting: Best time is 10 AM - 12 PM (bright natural light).\n3. Technique: Hold phone at chest height, keep it level.\n4. Quantity: Upload 8-10 photos. First shot should be the front exterior.",
  _timing: "BEST TIME TO SELL:\n\n- PEAK (Oct - Jan): Festival season, highest buyer activity.\n- GOOD (Jan - Mar): Financial year-end bonuses and tax planning.\n- SLOW (Jul - Sep): Monsoon season, fewer site visits.\n\nTip: List on Thursday/Friday as people browse most during weekends!",
  _description_guide: "WRITING THE PERFECT DESCRIPTION:\n\n1. Title: Under 60 chars. Include Type + Size + Location.\n2. Hook: Lead with your BEST feature (e.g., 'East-facing').\n3. Amenities: List parking, water, power backup clearly.\n4. Connectivity: Mention distance to nearest landmark/metro.",
  _sell: "How to sell on BhoomiTayi:\n\n1. Click 'Register Service' in the navbar\n2. Choose your category (House/Land/PG etc.)\n3. Fill in all property details\n4. Upload high-quality photos\n5. Set a competitive price\n6. Add your exact location\n7. Submit - it goes live immediately!",
  _price: "Pricing guidance:\n\n- Browse similar listings in your area to compare\n- Check price per sq.ft for houses & land\n- Factor in registration (5-7%) & stamp duty (1%)\n- For home loans: EMI should be < 40% of income\n- Negotiation margin: sellers usually list 5-10% above",
  _loan: "Home loan guide:\n\n1. Check your CIBIL score (aim for 750+)\n2. Compare rates - SBI, HDFC, ICICI, Axis\n3. Calculate EMI (should be < 40% of income)\n4. Prepare documents: ID, income proof, property papers\n\nCurrent rates: ~8.5-9.5%\nBanks fund 80% of property value\nTax benefit: Section 80C & 24B",
  _documents: "Essential property documents:\n\nFor Buying:\n- Sale Deed, Title Deed\n- EC - Encumbrance Certificate\n- Khata Certificate & Extract\n- Tax paid receipts\n- Building plan approval\n- Occupancy Certificate\n\nAlways get a lawyer to verify!",
  _help: "I'm Bella, your smarter real estate assistant!\n\nSelling Tips: 'listing guide', 'negotiation', 'market trends', 'photography', 'timing'\nProperty Help: houses, land, PG, commercial, vehicles, price guidance, documents\nSettings: 'dark/light mode', 'reading mode', 'font size', 'language', 'notifications'\n\nTry asking 'how to list' or 'what are the market trends'!",
  _thanks: "You're welcome! Happy to help. I'm always here if you need anything!",
  _bye: "Bye! Come back anytime. Happy property hunting!",
  _about_bella: "I'm Bella - your AI real estate assistant built right into BhoomiTayi! I've absorbed all of Tommy's knowledge to become even smarter.\n\nI can:\n- Give detailed step-by-step selling guides\n- Analyze market trends and pricing\n- Control ALL website settings via chat\n- Guide you through buying/selling\n- Speak in your language!",
};

async function matchIntent(
  message: string,
  intents: Intent[],
  t: (key: string) => string
): Promise<{ response: string; action?: () => void }> {
  const trimmed = message.trim();

  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      if (pattern.test(trimmed)) {
        if (intent.resolver) {
          const resolved = await intent.resolver(trimmed);
          return { response: resolved, action: intent.action };
        }
        const key = intent.responseKey;
        if (key && key.startsWith("_")) {
          return { response: KNOWLEDGE_RESPONSES[key] || t("bella.fallback"), action: intent.action };
        }
        return { response: key ? t(key) : t("bella.fallback"), action: intent.action };
      }
    }
  }

  return { response: t("bella.fallback") };
}

// ─── Draggable + Smart Position Component ────────────────────────

export function BellaChat() {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);

  // Drag state
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const bellaRef = useRef<HTMLDivElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();
  const settings = useSettingsStore();
  const { user } = useAuthStore();

  const router = useRouter();
  const intents = createBellaEngine(setTheme, (l) => i18n.changeLanguage(l), settings, user, t, router);

  // Initialize position at bottom-right on mount
  useEffect(() => {
    if (position.x === -1) {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
      });
    }
  }, [position.x]);

  // Reset welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: t("bella.welcome"),
        timestamp: new Date(),
      },
    ]);
    setHasSentMessage(false);
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

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

  // ── Smart chat box position ──
  const getChatBoxStyle = useCallback((): React.CSSProperties => {
    const chatW = 360;
    const chatH = 520;
    const pad = 12;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;

    let left = position.x - chatW / 2;
    let top = position.y - chatH - pad;

    // Horizontal bounds
    if (left + chatW > vw - pad) left = vw - chatW - pad;
    if (left < pad) left = pad;

    // If not enough space above, open below
    if (top < pad) {
      top = position.y + pad + 32;
    }
    // If not enough space below either, clamp
    if (top + chatH > vh - pad) {
      top = vh - chatH - pad;
    }

    return {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.min(chatW, vw - pad * 2)}px`,
      height: `${Math.min(chatH, vh - 100)}px`,
      zIndex: 51,
    };
  }, [position]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userInput = input.trim();
    setInput("");
    setIsTyping(true);
    setHasSentMessage(true);

    const { response, action } = await matchIntent(userInput, intents, t);
    if (action) action();

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleQuickCmd = async (cmd: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: cmd,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setHasSentMessage(true);
    
    const { response, action } = await matchIntent(cmd, intents, t);
    if (action) action();
    
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date() },
    ]);
    setIsTyping(false);
  };

  // Use mounted flag to avoid SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || position.x === -1) return null;

  return (
    <div id="bella-chat-root">
      {/* Draggable Floating Button - always rendered, hidden via display */}
      <div
        ref={bellaRef}
        id="bella-chat-button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="button"
        aria-label="Bella"
        className="fixed z-50 touch-none select-none"
        style={{
          left: `${position.x - 32}px`,
          top: `${position.y - 32}px`,
          cursor: isDragging ? "grabbing" : "grab",
          display: open ? "none" : "block",
        }}
      >
        <div className="size-16 rounded-full shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 overflow-hidden ring-3 ring-pink-400 hover:ring-pink-500 hover:scale-105">
          <Image src={BELLA_AVATAR} alt="Bella" width={64} height={64} className="size-full object-cover pointer-events-none" />
        </div>
        <span className="absolute -top-1 -right-1 flex size-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-4 bg-pink-500" />
        </span>
      </div>

      {/* Chat Window - positioned smartly */}
      {open && (
        <div
          style={getChatBoxStyle()}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-10 rounded-full overflow-hidden ring-2 ring-white/30">
                  <Image src={BELLA_AVATAR} alt="Bella" width={40} height={40} className="size-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-400 border-2 border-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t("bella.name")}</h3>
                <p className="text-xs text-white/80">{t("bella.subtitle")}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="size-8 rounded-full text-white hover:bg-white/20"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Quick Commands */}
          <div className="flex gap-1.5 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto">
            {["Dark mode", "Reading mode", "Font large", "Help"].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleQuickCmd(cmd)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/50 transition-colors border border-pink-200 dark:border-pink-800"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 size-7 rounded-full overflow-hidden">
                      <Image src={BELLA_AVATAR} alt="Bella" width={28} height={28} className="size-full object-cover" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-br-md"
                        : "bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 size-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <User className="size-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 items-center animate-in fade-in duration-200">
                  <div className="flex-shrink-0 size-7 rounded-full overflow-hidden">
                    <Image src={BELLA_AVATAR} alt="Bella" width={28} height={28} className="size-full object-cover" />
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="size-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="size-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="size-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input + Exit Button */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("bella.placeholder")}
                className="rounded-xl border-zinc-200 dark:border-zinc-700 text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white flex-shrink-0"
              >
                <Send className="size-4" />
              </Button>
            </form>
            {hasSentMessage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-3" />
                {t("bella.exit")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
