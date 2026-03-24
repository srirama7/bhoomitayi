"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, TrendingUp, IndianRupee, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/lib/store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const TOMMY_RESPONSES: Record<string, string> = {
  hello: "Hey there! I'm Tommy, your selling assistant. I help sellers like you get the best deals on BhoomiTayi. What would you like help with?\n\n- Listing your property\n- Pricing advice\n- Market insights\n- Photography tips\n- Negotiation strategies",
  hi: "Hi! I'm Tommy, your go-to assistant for selling on BhoomiTayi. Ready to help you list and sell your property. What do you need?",
  list: "Here's how to create a great listing on BhoomiTayi:\n\n1. Click 'Register Service' in the navbar\n2. Choose the right category\n3. Add a compelling title\n4. Write a detailed description\n5. Upload high-quality photos (at least 5-6)\n6. Set a competitive price\n7. Add accurate location details\n\nA good listing gets 3x more inquiries!",
  price: "Pricing your property right is crucial! Here are my tips:\n\n- Research similar properties in your area\n- Consider location premium (main road, corner plot)\n- Factor in property age & condition\n- Check recent sale prices (Registration office data)\n- Price 5-10% above your minimum to allow negotiation\n- Don't overprice - it reduces visibility\n\nWould you like area-specific pricing guidance?",
  photo: "Great photos can increase inquiries by 5x! Here's how:\n\n- Shoot during golden hour (morning/evening)\n- Clean & declutter before shooting\n- Use landscape orientation\n- Capture all rooms + exterior\n- Show the neighborhood & surroundings\n- Include floor plan if possible\n- Minimum 6-8 photos per listing\n- Use natural lighting, avoid flash\n\nFirst impression matters!",
  negotiate: "Negotiation tips for sellers:\n\n- Know your minimum price before negotiating\n- Don't accept the first offer\n- Let the buyer make the first offer\n- Highlight unique features of your property\n- Be patient - good buyers will come\n- Keep emotions out of the deal\n- Get everything in writing\n- Consider earnest money (token advance)\n\nConfidence is key!",
  market: "Current Real Estate Market Insights:\n\n- Residential demand is growing in tier-2 cities\n- Land prices have appreciated 8-12% YoY\n- PG/Rental market is booming near IT hubs\n- Commercial spaces near metro lines are hot\n- Green buildings command 10-15% premium\n- Festival season (Oct-Jan) sees higher demand\n\nTip: List your property before peak season for maximum visibility!",
  documents: "Documents needed for selling property:\n\n Seller must have:\n- Original Sale Deed\n- Title Deed (chain of ownership)\n- Encumbrance Certificate (last 30 years)\n- Khata Certificate & Extract\n- Latest Tax Paid Receipt\n- Building Plan Approval\n- Occupancy Certificate\n- ID & Address Proof\n- Recent Property Photos\n\n Pro tip: Keep all documents ready before listing - it speeds up the sale!",
  description: "Tips for writing a great property description:\n\n- Start with the best feature\n- Mention total area (sq ft / cents / acres)\n- Highlight nearby landmarks & facilities\n- Include floor/BHK details for houses\n- Mention parking & amenities\n- Add connectivity info (distance to highway, bus stop)\n- Be honest - don't oversell\n- Use bullet points for readability\n\nExample: '3BHK, 1500 sqft, East-facing, 2nd floor, near MG Road Metro, covered parking, 24/7 security'",
  timing: "Best time to sell property:\n\n- Festival season (Dussehra to New Year) - highest demand\n- Financial year end (Jan-Mar) - tax planning buyers\n- Before monsoon - easier site visits\n- Weekends get more inquiries\n\nAvoid:\n- During monsoon (Jun-Aug) - fewer site visits\n- Election periods - market uncertainty\n- Budget announcement week\n\nList early and stay patient!",
  help: "I can help you with:\n\n- How to create a great listing\n- Pricing your property competitively\n- Photography tips for listings\n- Writing compelling descriptions\n- Negotiation strategies\n- Market trends & insights\n- Required documents for selling\n- Best timing to sell\n\nJust ask me anything about selling!",
  default: "I'm Tommy, your selling assistant! I can help with:\n\n- Listing tips & best practices\n- Pricing advice & market rates\n- Photography tips\n- Description writing help\n- Negotiation strategies\n- Document requirements\n- Market insights & timing\n\nWhat would you like to know about selling?",
};

function getTommyResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("hello") || lower.includes("hey")) return TOMMY_RESPONSES.hello;
  if (lower.includes("hi") || lower.includes("hii")) return TOMMY_RESPONSES.hi;
  if (lower.includes("list") || lower.includes("create") || lower.includes("post") || lower.includes("add")) return TOMMY_RESPONSES.list;
  if (lower.includes("price") || lower.includes("cost") || lower.includes("rate") || lower.includes("value") || lower.includes("worth")) return TOMMY_RESPONSES.price;
  if (lower.includes("photo") || lower.includes("image") || lower.includes("picture") || lower.includes("camera")) return TOMMY_RESPONSES.photo;
  if (lower.includes("negoti") || lower.includes("deal") || lower.includes("offer") || lower.includes("bargain")) return TOMMY_RESPONSES.negotiate;
  if (lower.includes("market") || lower.includes("trend") || lower.includes("demand") || lower.includes("insight")) return TOMMY_RESPONSES.market;
  if (lower.includes("document") || lower.includes("paper") || lower.includes("deed") || lower.includes("khata")) return TOMMY_RESPONSES.documents;
  if (lower.includes("description") || lower.includes("write") || lower.includes("title") || lower.includes("content")) return TOMMY_RESPONSES.description;
  if (lower.includes("time") || lower.includes("when") || lower.includes("season") || lower.includes("best time")) return TOMMY_RESPONSES.timing;
  if (lower.includes("help") || lower.includes("what can") || lower.includes("features")) return TOMMY_RESPONSES.help;

  return TOMMY_RESPONSES.default;
}

const QUICK_ACTIONS = [
  { label: "Listing Tips", icon: FileText, query: "How to create a listing?" },
  { label: "Pricing Advice", icon: IndianRupee, query: "How to price my property?" },
  { label: "Market Trends", icon: TrendingUp, query: "What are the market trends?" },
  { label: "Photo Tips", icon: BarChart3, query: "Tips for property photos?" },
];

export default function TommyPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm Tommy, your selling assistant. I'll help you sell faster and smarter on BhoomiTayi. Ask me about listing tips, pricing, market trends, or anything about selling!",
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

  const handleSend = (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msgText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getTommyResponse(userMsg.content);
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
            <Sparkles className="size-5 text-white" />
          </div>
          Tommy - Seller Assistant
        </h1>
        <p className="mt-2 text-muted-foreground">Your AI-powered assistant for selling tips, pricing advice, and market insights.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card
                className="cursor-pointer rounded-xl border-zinc-200/80 dark:border-zinc-800/80 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 bg-white dark:bg-zinc-900/80"
                onClick={() => handleSend(action.query)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-md">
                    <Icon className="size-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chat Area */}
      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
          <div className="relative">
            <div className="flex items-center justify-center size-10 rounded-full bg-white/20 backdrop-blur-sm">
              <Bot className="size-5" />
            </div>
            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-400 border-2 border-orange-500" />
          </div>
          <div>
            <h3 className="font-bold">Tommy</h3>
            <p className="text-xs text-white/80">Seller Assistant - Always Online</p>
          </div>
        </div>

        <ScrollArea ref={scrollRef} className="h-[400px] p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 size-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                    <Bot className="size-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-br-md"
                      : "bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 size-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <User className="size-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
                <div className="flex-shrink-0 size-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
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

        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
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
              placeholder="Ask Tommy about selling..."
              className="rounded-xl border-zinc-200 dark:border-zinc-700"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white flex-shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
