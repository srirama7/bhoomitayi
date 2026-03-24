"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/lib/store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const BELLA_RESPONSES: Record<string, string> = {
  hello: "Hello! I'm Bella, your real estate assistant. I can help you find properties, understand listings, and guide you through the buying process. What are you looking for today?",
  hi: "Hi there! I'm Bella, here to help you find your dream property. Are you looking for a house, land, PG, or commercial space?",
  house: "Great choice! We have a wide selection of houses. You can browse them at the Houses section. Would you like tips on what to look for when buying a house?\n\n Key things to check:\n- Location & neighborhood\n- Property age & condition\n- Legal documents (Khata, EC)\n- Water & electricity supply\n- Proximity to schools & hospitals",
  land: "Looking for land? That's a great investment! Check out our Land section for available plots.\n\n Tips for buying land:\n- Verify the land title & ownership\n- Check for encumbrances\n- Confirm zoning regulations\n- Visit the site personally\n- Check access roads & utilities",
  pg: "Looking for a PG accommodation? We have many options! Browse our PG section.\n\n Things to consider:\n- Location & commute distance\n- Rent & deposit amount\n- Food included or not\n- WiFi & amenities\n- House rules & timings",
  commercial: "Interested in commercial property? Great for business! Check our Commercial section.\n\n Consider these factors:\n- Foot traffic & visibility\n- Parking availability\n- Lease terms & rent escalation\n- Power backup & infrastructure\n- Proximity to public transport",
  vehicle: "Looking for vehicles? Browse our Vehicles section for available options.\n\n Tips for buying:\n- Check vehicle history & papers\n- Verify insurance & RC transfer\n- Test drive before buying\n- Compare prices in the market\n- Check mileage & condition",
  price: "Property prices vary based on location, size, and type. I'd recommend:\n\n1. Browse listings in your preferred area\n2. Compare prices of similar properties\n3. Check recent sale prices in the area\n4. Factor in registration & stamp duty costs\n5. Consider future appreciation potential\n\nWould you like to explore any specific category?",
  sell: "Want to sell your property? You can list it on BhoomiTayi!\n\n1. Go to the 'Register Service' button\n2. Choose your property type\n3. Fill in the details & upload photos\n4. Your listing will be live!\n\nOur Tommy assistant in the Dashboard can help you with selling tips!",
  help: "I can help you with:\n\n- Finding properties (houses, land, PG, commercial)\n- Understanding property types\n- Buying tips & guidance\n- Price comparisons\n- Selling your property\n- General real estate advice\n\nJust ask me anything about real estate!",
  loan: "For home loans, here are some tips:\n\n- Compare interest rates from multiple banks\n- Check your CIBIL score (750+ is ideal)\n- Keep documents ready: ID, income proof, property papers\n- Loan typically covers 80% of property value\n- EMI should not exceed 40% of your monthly income\n\nPopular banks: SBI, HDFC, ICICI, Axis Bank",
  documents: "Important documents for property purchase:\n\n- Sale Deed\n- Title Deed\n- Encumbrance Certificate (EC)\n- Khata Certificate & Extract\n- Tax paid receipts\n- Building plan approval\n- Occupancy Certificate\n- No Objection Certificates (NOC)\n\nAlways verify documents with a lawyer!",
  default: "I'm not sure I understand that completely, but I'm here to help! You can ask me about:\n\n- Finding houses, land, PG, or commercial properties\n- Property buying tips\n- Price guidance\n- Required documents\n- Home loans\n- How to sell on BhoomiTayi\n\nWhat would you like to know?",
};

function getBellaResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("hello") || lower.includes("hey")) return BELLA_RESPONSES.hello;
  if (lower.includes("hi") || lower.includes("hii")) return BELLA_RESPONSES.hi;
  if (lower.includes("house") || lower.includes("home") || lower.includes("flat") || lower.includes("apartment")) return BELLA_RESPONSES.house;
  if (lower.includes("land") || lower.includes("plot") || lower.includes("site")) return BELLA_RESPONSES.land;
  if (lower.includes("pg") || lower.includes("paying guest") || lower.includes("hostel") || lower.includes("room")) return BELLA_RESPONSES.pg;
  if (lower.includes("commercial") || lower.includes("office") || lower.includes("shop") || lower.includes("warehouse")) return BELLA_RESPONSES.commercial;
  if (lower.includes("vehicle") || lower.includes("car") || lower.includes("bike")) return BELLA_RESPONSES.vehicle;
  if (lower.includes("price") || lower.includes("cost") || lower.includes("rate") || lower.includes("budget")) return BELLA_RESPONSES.price;
  if (lower.includes("sell") || lower.includes("list") || lower.includes("register")) return BELLA_RESPONSES.sell;
  if (lower.includes("help") || lower.includes("what can") || lower.includes("features")) return BELLA_RESPONSES.help;
  if (lower.includes("loan") || lower.includes("emi") || lower.includes("finance") || lower.includes("bank")) return BELLA_RESPONSES.loan;
  if (lower.includes("document") || lower.includes("paper") || lower.includes("khata") || lower.includes("deed")) return BELLA_RESPONSES.documents;

  return BELLA_RESPONSES.default;
}

export function BellaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Bella, your real estate assistant. How can I help you today? You can ask me about properties, buying tips, or anything real estate related!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuthStore();

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
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getBellaResponse(userMsg.content);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
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
            <Button
              onClick={() => setOpen(true)}
              className="size-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300"
            >
              <MessageCircle className="size-6 text-white" />
            </Button>
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
            style={{ height: "500px", maxHeight: "calc(100vh - 100px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex items-center justify-center size-10 rounded-full bg-white/20 backdrop-blur-sm">
                    <Sparkles className="size-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-400 border-2 border-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Bella</h3>
                  <p className="text-xs text-white/80">Real Estate Assistant</p>
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
                      <div className="flex-shrink-0 size-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                        <Bot className="size-4 text-white" />
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
                    <div className="flex-shrink-0 size-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <Bot className="size-4 text-white" />
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
                  placeholder="Ask Bella anything..."
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
