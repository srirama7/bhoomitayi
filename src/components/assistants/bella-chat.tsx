"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, User } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettingsStore, type SiteSettings } from "@/lib/settings-store";

const BELLA_AVATAR = "/bella-avatar.jpg";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Handwritten AI Engine ───────────────────────────────────────
// Pattern-based intent detection with action execution

interface Intent {
  patterns: RegExp[];
  response: string;
  action?: () => void;
}

function createBellaEngine(
  setTheme: (t: string) => void,
  changeLanguage: (l: string) => void,
  settings: SiteSettings
) {
  const intents: Intent[] = [
    // ── Settings: Theme ──
    {
      patterns: [/dark\s*mode/i, /turn.*dark/i, /switch.*dark/i, /enable.*dark/i, /make.*dark/i, /go\s*dark/i],
      response: "Done! I've switched to dark mode for you. The whole site is now in dark theme. Say 'light mode' to switch back!",
      action: () => setTheme("dark"),
    },
    {
      patterns: [/light\s*mode/i, /turn.*light/i, /switch.*light/i, /enable.*light/i, /make.*light/i, /go\s*light/i],
      response: "Done! Switched to light mode. Everything should be bright and clean now. Say 'dark mode' to switch back!",
      action: () => setTheme("light"),
    },
    {
      patterns: [/system\s*(mode|theme)/i, /auto\s*(mode|theme)/i, /default\s*theme/i],
      response: "Done! Theme is now set to follow your system preference. It'll automatically switch between light and dark!",
      action: () => setTheme("system"),
    },

    // ── Settings: Reading Mode ──
    {
      patterns: [/reading\s*mode\s*on/i, /turn.*reading/i, /enable.*reading/i, /start.*reading/i, /reading\s*mode/i],
      response: "Reading mode activated! The site now uses warm sepia tones and a serif font for comfortable reading. Say 'reading mode off' to disable.",
      action: () => settings.setReadingMode(true),
    },
    {
      patterns: [/reading\s*mode\s*off/i, /disable.*reading/i, /stop.*reading/i, /no.*reading/i, /exit.*reading/i],
      response: "Reading mode disabled! Back to the normal view.",
      action: () => settings.setReadingMode(false),
    },

    // ── Settings: High Contrast ──
    {
      patterns: [/high\s*contrast\s*on/i, /turn.*contrast/i, /enable.*contrast/i, /more\s*contrast/i, /high\s*contrast/i],
      response: "High contrast mode enabled! Text and borders are now bolder for better visibility. Say 'contrast off' to disable.",
      action: () => settings.setHighContrast(true),
    },
    {
      patterns: [/contrast\s*off/i, /disable.*contrast/i, /normal\s*contrast/i, /low\s*contrast/i],
      response: "High contrast disabled. Back to normal colors!",
      action: () => settings.setHighContrast(false),
    },

    // ── Settings: Font Size ──
    {
      patterns: [/font\s*(size)?\s*small/i, /smaller\s*(text|font)/i, /decrease.*font/i, /text\s*small/i],
      response: "Font size set to small. Everything should look more compact now. Say 'font large' to increase!",
      action: () => settings.setFontSize("small"),
    },
    {
      patterns: [/font\s*(size)?\s*medium/i, /normal\s*(text|font|size)/i, /default\s*(text|font|size)/i, /reset.*font/i],
      response: "Font size reset to medium (default). Comfortable for most screens!",
      action: () => settings.setFontSize("medium"),
    },
    {
      patterns: [/font\s*(size)?\s*large/i, /bigger\s*(text|font)/i, /increase.*font/i, /text\s*large/i, /large\s*text/i, /larger/i],
      response: "Font size set to large! Text should be easier to read now. Say 'font extra large' for even bigger!",
      action: () => settings.setFontSize("large"),
    },
    {
      patterns: [/font\s*(size)?\s*(extra|x)\s*large/i, /biggest\s*(text|font)/i, /very\s*large/i, /xlarge/i, /extra\s*large/i],
      response: "Font size set to extra large! Maximum readability. Say 'font medium' to go back to default.",
      action: () => settings.setFontSize("xlarge"),
    },

    // ── Settings: Reduce Animations ──
    {
      patterns: [/reduce.*anim/i, /stop.*anim/i, /disable.*anim/i, /no.*anim/i, /less.*motion/i, /animation.*off/i],
      response: "Animations reduced! The site will feel snappier with less motion. Say 'enable animations' to restore.",
      action: () => settings.setReduceAnimations(true),
    },
    {
      patterns: [/enable.*anim/i, /restore.*anim/i, /animation.*on/i, /more.*motion/i, /turn.*anim.*on/i],
      response: "Animations restored! The site will have smooth transitions and effects again.",
      action: () => settings.setReduceAnimations(false),
    },

    // ── Settings: Compact Mode ──
    {
      patterns: [/compact\s*mode/i, /enable.*compact/i, /tight.*spacing/i, /compact.*on/i],
      response: "Compact mode enabled! Spacing is tighter so you can see more content. Say 'compact off' to disable.",
      action: () => settings.setCompactMode(true),
    },
    {
      patterns: [/compact.*off/i, /disable.*compact/i, /normal.*spacing/i, /spacious/i],
      response: "Compact mode disabled. Back to comfortable spacing!",
      action: () => settings.setCompactMode(false),
    },

    // ── Settings: Language ──
    {
      patterns: [/english/i, /lang.*en/i, /switch.*english/i],
      response: "Language switched to English!",
      action: () => changeLanguage("en"),
    },
    {
      patterns: [/kannada/i, /kannad/i, /lang.*kn/i],
      response: "ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ! Language changed to Kannada!",
      action: () => changeLanguage("kn"),
    },
    {
      patterns: [/hindi/i, /lang.*hi/i],
      response: "भाषा हिंदी में बदल दी गई! Language changed to Hindi!",
      action: () => changeLanguage("hi"),
    },
    {
      patterns: [/telugu/i, /lang.*te/i],
      response: "భాష తెలుగులోకి మార్చబడింది! Language changed to Telugu!",
      action: () => changeLanguage("te"),
    },
    {
      patterns: [/malayalam/i, /lang.*ml/i],
      response: "ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി! Language changed to Malayalam!",
      action: () => changeLanguage("ml"),
    },
    {
      patterns: [/tamil/i, /lang.*ta/i],
      response: "மொழி தமிழுக்கு மாற்றப்பட்டது! Language changed to Tamil!",
      action: () => changeLanguage("ta"),
    },

    // ── Settings: Reset ──
    {
      patterns: [/reset.*settings/i, /default.*settings/i, /restore.*defaults/i, /reset\s*all/i],
      response: "All settings have been reset to defaults! Theme set to system, font to medium, and all modes disabled.",
      action: () => { settings.resetAll(); setTheme("system"); },
    },

    // ── Settings: What can you control ──
    {
      patterns: [/what.*can.*control/i, /what.*settings/i, /what.*can.*change/i, /what.*can.*do.*settings/i, /settings.*commands/i, /commands/i],
      response: "I can control all these settings for you! Just say:\n\nTheme:\n• 'dark mode' / 'light mode' / 'system mode'\n\nDisplay:\n• 'reading mode' - warm sepia tones + serif font\n• 'high contrast' - bold text & borders\n• 'compact mode' - tighter spacing\n• 'reduce animations' - less motion\n\nFont Size:\n• 'font small' / 'font medium' / 'font large' / 'font extra large'\n\nLanguage:\n• 'English' / 'Kannada' / 'Hindi' / 'Telugu' / 'Malayalam' / 'Tamil'\n\nOther:\n• 'reset settings' - restore all defaults\n\nTry saying 'dark mode' or 'reading mode' right now!",
    },

    // ── Greetings ──
    {
      patterns: [/^hello/i, /^hey/i, /^good\s*(morning|afternoon|evening)/i],
      response: "Hello! I'm Bella, your friendly real estate assistant! I can help you:\n\n• Find properties (houses, land, PG, commercial)\n• Get buying/selling tips\n• Control website settings (just ask me!)\n• Navigate the platform\n\nTry saying 'dark mode', 'reading mode', or ask me about any property type!",
    },
    {
      patterns: [/^hi\b/i, /^hii/i, /^hola/i, /^namaste/i],
      response: "Hi there! I'm Bella, your real estate buddy! What can I help with?\n\nI can find properties, give tips, AND control the entire website for you.\nTry: 'dark mode', 'increase font', 'reading mode', or ask about houses!",
    },

    // ── Property Help ──
    {
      patterns: [/house/i, /home/i, /flat/i, /apartment/i, /villa/i, /bhk/i],
      response: "Looking for a house? Here's how:\n\nStep 1: Go to the Houses section from the menu\nStep 2: Browse listings or use search to filter\nStep 3: Click on a listing for full details & photos\nStep 4: Hit 'Send Inquiry' to contact the seller\n\nKey things to check:\n• Location & neighborhood safety\n• Legal documents (Khata, EC, Sale Deed)\n• Water & electricity supply\n• Parking & amenities\n• Compare price per sq.ft with nearby properties\n\nWant me to change any settings while you browse? Just ask!",
    },
    {
      patterns: [/land/i, /plot/i, /site/i, /acre/i],
      response: "Land investment tips:\n\nStep 1: Browse the Land section\nStep 2: Check plot dimensions & total area\nStep 3: Verify Khata type (A Khata is best)\nStep 4: Visit the site in person\nStep 5: Get EC (Encumbrance Certificate) verified\n\nImportant checks:\n• Clear title deed & ownership chain\n• No encumbrances or legal disputes\n• Proper road access\n• Zoning regulations (residential/commercial)\n• BBMP/BDA approval status",
    },
    {
      patterns: [/pg/i, /paying\s*guest/i, /hostel/i, /room\s*(for|to)\s*rent/i],
      response: "PG hunting guide:\n\nStep 1: Check the PG section for listings\nStep 2: Filter by your preferred area & budget\nStep 3: Compare amenities (food, WiFi, laundry)\nStep 4: Visit and check the room condition\nStep 5: Confirm rent, deposit & house rules\n\nPro tips:\n• Visit during meal times to check food quality\n• Ask about guest/visitor policies\n• Check water & power backup\n• Ask current residents about their experience",
    },
    {
      patterns: [/commercial/i, /office/i, /shop/i, /warehouse/i, /showroom/i],
      response: "Commercial space guide:\n\nStep 1: Browse Commercial section\nStep 2: Check carpet area vs super built-up\nStep 3: Visit during business hours to check foot traffic\nStep 4: Review lease terms carefully\n\nKey factors:\n• Parking availability for customers\n• Power backup & internet infrastructure\n• Fire safety & emergency exits\n• Proximity to public transport\n• Rent escalation clause (usually 5-10% yearly)",
    },
    {
      patterns: [/vehicle/i, /car/i, /bike/i, /scooter/i, /truck/i],
      response: "Vehicle buying guide:\n\nStep 1: Browse the Vehicles section\nStep 2: Check year, KMs driven & number of owners\nStep 3: Verify RC, insurance & pollution certificate\nStep 4: Request a test drive\nStep 5: Negotiate price based on condition\n\nRed flags to watch:\n• Odometer tampering\n• Mismatched paint (accident history)\n• Expired insurance or RC\n• Multiple ownership transfers in short time",
    },
    {
      patterns: [/sell/i, /list.*property/i, /register.*service/i, /post.*listing/i],
      response: "How to sell on BhoomiTayi:\n\nStep 1: Click 'Register Service' in the navbar\nStep 2: Choose your category (House/Land/PG etc.)\nStep 3: Fill in all property details\nStep 4: Upload 6-10 high-quality photos\nStep 5: Set a competitive price\nStep 6: Add your exact location\nStep 7: Submit - it goes live immediately!\n\nFor detailed selling tips, visit Tommy in your Dashboard. He's the expert!",
    },
    {
      patterns: [/price/i, /cost/i, /rate/i, /budget/i, /afford/i, /cheap/i, /expensive/i],
      response: "Pricing guidance:\n\n• Browse similar listings in your area to compare\n• Check price per sq.ft for houses & land\n• Factor in registration (5-7%) & stamp duty (1%)\n• For home loans: EMI should be < 40% of income\n• Negotiation margin: sellers usually list 5-10% above\n\nPopular loan providers: SBI (lowest rates), HDFC, ICICI\nCIBIL score 750+ gets best rates\n\nNeed to change text size while reading? Say 'font large'!",
    },
    {
      patterns: [/loan/i, /emi/i, /finance/i, /mortgage/i, /bank/i],
      response: "Home loan guide:\n\nStep 1: Check your CIBIL score (aim for 750+)\nStep 2: Compare rates - SBI, HDFC, ICICI, Axis\nStep 3: Calculate EMI (should be < 40% of income)\nStep 4: Prepare documents: ID, income proof, property papers\nStep 5: Apply online or visit branch\n\nKey facts:\n• Banks fund 80% of property value\n• Tenure: 15-30 years\n• Processing fee: 0.5-1%\n• Current rates: ~8.5-9.5%\n• Tax benefit: Section 80C (principal) & 24B (interest)",
    },
    {
      patterns: [/document/i, /paper/i, /khata/i, /deed/i, /ec\b/i, /encumbrance/i],
      response: "Essential property documents:\n\n For Buying:\n• Sale Deed (from seller)\n• Title Deed (ownership proof)\n• EC - Encumbrance Certificate\n• Khata Certificate & Extract\n• Tax paid receipts\n• Building plan approval\n• Occupancy Certificate\n• NOC certificates\n\n For Home Loan:\n• Property documents above\n• Your ID & address proof\n• Income proof (salary slips / ITR)\n• Bank statements (6 months)\n• Passport photos\n\nAlways get a lawyer to verify before paying!",
    },

    // ── Help ──
    {
      patterns: [/help/i, /what can you/i, /features/i, /what do you/i, /how.*use/i],
      response: "I'm Bella, your all-in-one assistant! Here's everything I can do:\n\nProperty Help:\n• Ask about houses, land, PG, commercial, vehicles\n• Buying & selling tips\n• Price guidance & loan info\n• Document checklist\n\nSettings Control (just say it!):\n• 'dark mode' / 'light mode'\n• 'reading mode' - warm cozy reading\n• 'high contrast' - better visibility\n• 'compact mode' - see more content\n• 'reduce animations' - less motion\n• 'font small/medium/large/extra large'\n• 'Kannada/Hindi/Telugu/Tamil/Malayalam'\n• 'reset settings'\n\nTry any command right now!",
    },

    // ── Fun/Personality ──
    {
      patterns: [/thank/i, /thanks/i, /thx/i],
      response: "You're welcome! Happy to help. I'm always here if you need anything - just type away! And remember, you can control the whole site through me.",
    },
    {
      patterns: [/bye/i, /goodbye/i, /see ya/i, /later/i],
      response: "Bye! Come back anytime. I'll be right here in the corner waiting to help! Happy property hunting!",
    },
    {
      patterns: [/who.*are.*you/i, /your.*name/i, /about.*you/i],
      response: "I'm Bella - your AI real estate assistant built right into BhoomiTayi! No external AI models here - I'm 100% handcrafted with love.\n\nI can:\n• Help you find & understand properties\n• Control ALL website settings via chat\n• Guide you through buying/selling\n• Give tips and advice\n\nI live in this little chat bubble and I'm always happy to help!",
    },
  ];

  return intents;
}

function matchIntent(message: string, intents: Intent[]): { response: string; action?: () => void } {
  const trimmed = message.trim();

  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      if (pattern.test(trimmed)) {
        return { response: intent.response, action: intent.action };
      }
    }
  }

  return {
    response: "I'm not sure about that, but I'm here to help! Try:\n\n• Ask about properties: 'houses', 'land', 'PG'\n• Control settings: 'dark mode', 'reading mode', 'font large'\n• Say 'help' to see everything I can do\n• Say 'commands' to see all settings I control\n\nI understand natural language - just type what you need!",
  };
}

// ─── Component ───────────────────────────────────────────────────

export function BellaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Bella, your smart assistant! I can help you find properties AND control the entire website.\n\nTry saying:\n• 'dark mode' or 'light mode'\n• 'reading mode' for cozy reading\n• 'font large' for bigger text\n• 'help' to see everything I can do!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();
  const { i18n } = useTranslation();
  const settings = useSettingsStore();

  const intents = createBellaEngine(setTheme, (l) => i18n.changeLanguage(l), settings);

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

  const handleSend = () => {
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

    setTimeout(() => {
      const { response, action } = matchIntent(userInput, intents);

      // Execute the action (change setting, theme, etc.)
      if (action) action();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 500 + Math.random() * 500);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setOpen(true)}
              className="size-16 rounded-full shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 overflow-hidden ring-3 ring-pink-400 hover:ring-pink-500 hover:scale-105"
            >
              <Image src={BELLA_AVATAR} alt="Bella" width={64} height={64} className="size-full object-cover" />
            </button>
            <span className="absolute -top-1 -right-1 flex size-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-4 bg-pink-500" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "520px", maxHeight: "calc(100vh - 100px)" }}
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
                  <h3 className="font-bold text-sm">Bella</h3>
                  <p className="text-xs text-white/80">AI Assistant - Controls Everything</p>
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
                  onClick={() => {
                    setInput(cmd);
                    setTimeout(() => {
                      const fakeInput = cmd;
                      const userMsg: Message = {
                        id: Date.now().toString(),
                        role: "user",
                        content: fakeInput,
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, userMsg]);
                      setIsTyping(true);
                      setTimeout(() => {
                        const { response, action } = matchIntent(fakeInput, intents);
                        if (action) action();
                        setMessages((prev) => [
                          ...prev,
                          { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date() },
                        ]);
                        setIsTyping(false);
                      }, 500);
                    }, 100);
                    setInput("");
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/50 transition-colors border border-pink-200 dark:border-pink-800"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 items-center"
                  >
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
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
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
                  placeholder="Try 'dark mode' or ask anything..."
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
