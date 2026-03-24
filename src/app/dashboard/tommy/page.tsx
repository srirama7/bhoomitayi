"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, TrendingUp, IndianRupee, FileText, BarChart3 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/lib/store";

const TOMMY_AVATAR = "/tommy-avatar.avif";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const TOMMY_RESPONSES: Record<string, string> = {
  hello: "Hey there! I'm Tommy, your step-by-step selling guide on BhoomiTayi! I'll walk you through everything in detail. What do you need help with?\n\nHere's what I can guide you through:\n\nStep 1: Choose a topic below\nStep 2: I'll give you detailed instructions\nStep 3: Follow along and ask questions!\n\nTopics I cover:\n- How to list your property (full walkthrough)\n- Pricing strategy (with examples)\n- Photography guide (camera settings & angles)\n- Market analysis & insights\n- Negotiation playbook\n- Document checklist\n\nJust type what you need!",
  hi: "Hi! I'm Tommy, your selling guide! I walk you through every step with clear instructions. What would you like to learn about today?",
  list: "COMPLETE LISTING GUIDE - Follow these steps exactly:\n\nStep 1: Go to Homepage\n- Click the green 'Register Service' button in the top navbar\n- Or go to Menu > Register Service on mobile\n\nStep 2: Select Category\n- House/Apartment\n- Land/Plot\n- PG/Hostel\n- Commercial Space\n- Vehicle\n- Commodity\n\nStep 3: Fill Property Details\n- Title: Keep it short & catchy (e.g., '3BHK Villa near JP Nagar')\n- Description: Write 100+ words covering all features\n- Area: Enter exact sq.ft / cents / acres\n- Price: Set competitive price (see pricing tips)\n\nStep 4: Upload Photos\n- Click 'Upload Images' button\n- Select 6-10 high quality photos\n- First photo = thumbnail (make it the best one!)\n- Max file size: 5MB per image\n\nStep 5: Set Location\n- Enter your full address\n- Select city & area from dropdown\n- Pin exact location on map (if available)\n\nStep 6: Review & Submit\n- Double check all details\n- Preview how it looks\n- Click 'Submit Listing'\n- Your listing goes live immediately!\n\nPro Tip: Complete listings with 6+ photos get 3x more inquiries than incomplete ones!\n\nNeed help with any specific step? Just ask!",
  price: "PRICING YOUR PROPERTY - Complete Step-by-Step Guide:\n\nStep 1: Research Comparable Properties\n- Go to BhoomiTayi homepage\n- Search for properties in YOUR area\n- Note down prices of 5-10 similar properties\n- Calculate the average price per sq.ft\n\nStep 2: Evaluate Your Property's Value\n- Base price = Average price/sqft x Your area\n- Add premium for:\n  +5-10% if main road facing\n  +5-8% if corner property\n  +3-5% if recently renovated\n  +5-10% if east/north facing\n  +10-15% if gated community\n- Subtract for:\n  -5-10% if property is 10+ years old\n  -5% if interior road\n  -3-5% if needs repairs\n\nStep 3: Set Your Price Range\n- Listing Price = Base + Premiums + 5-10% negotiation buffer\n- Minimum Price = Your actual expected amount\n- Example: If you want 50L, list at 55-58L\n\nStep 4: Compare & Adjust\n- If no inquiries in 2 weeks, reduce by 3-5%\n- If too many inquiries immediately, you may be underpriced\n- Sweet spot: 5-10 inquiries per week\n\nStep 5: Registration & Additional Costs (Inform Buyers)\n- Stamp Duty: 5-7% of property value\n- Registration Fee: 1%\n- GST (if applicable): 5% for under-construction\n\nNeed help calculating price for your specific property? Tell me the details!",
  photo: "PROPERTY PHOTOGRAPHY GUIDE - Step by Step:\n\nStep 1: Prepare the Property (1 day before)\n- Deep clean every room\n- Remove personal items & clutter\n- Fix any visible damage (cracks, peeling paint)\n- Mow the lawn, trim hedges (if applicable)\n- Replace burnt-out light bulbs\n\nStep 2: Equipment Setup\n- Use a smartphone with a good camera (12MP+)\n- Clean the camera lens!\n- Turn on HDR mode\n- Set to landscape (horizontal) orientation\n- Turn OFF flash (use natural light only)\n\nStep 3: Timing\n- Best time: 10 AM - 12 PM (bright natural light)\n- Alternative: 3 PM - 5 PM (warm golden light)\n- Open ALL curtains and blinds\n- Turn ON all interior lights\n\nStep 4: What to Photograph (in this order)\n1. Front exterior (the money shot!)\n2. Living room (from corner, showing full room)\n3. Kitchen\n4. Master bedroom\n5. Other bedrooms\n6. Bathrooms\n7. Balcony/terrace\n8. Parking area\n9. Neighborhood/street view\n10. Any special features (garden, pool, view)\n\nStep 5: Shooting Technique\n- Stand in doorway/corner for widest angle\n- Hold phone at chest height\n- Keep it level (no tilting!)\n- Take 3 shots of each room from different angles\n- Capture the floor and ceiling in frame\n\nStep 6: Edit & Upload\n- Increase brightness slightly (+10-15%)\n- Boost contrast slightly\n- Crop out any distracting elements\n- Upload the best 8-10 photos\n- Set the best exterior shot as the first image\n\nYour photos are the FIRST thing buyers see - make them count!",
  negotiate: "NEGOTIATION PLAYBOOK - Your Step-by-Step Strategy:\n\nStep 1: Preparation (Before Any Buyer Calls)\n- Know your MINIMUM acceptable price\n- Write down 5 unique selling points of your property\n- Research what similar properties sold for recently\n- Prepare answers to common objections\n\nStep 2: First Contact with Buyer\n- Be friendly and professional\n- Ask what they're looking for (understand their needs)\n- DON'T reveal your minimum price!\n- Let THEM make the first offer\n- Say: 'What's your budget range?'\n\nStep 3: Site Visit\n- Clean and prepare the property\n- Highlight all positive features during the tour\n- Point out nearby amenities (schools, hospitals, markets)\n- Let them take their time - don't rush\n- Mention: 'Several other buyers are also interested'\n\nStep 4: Handling the First Offer\n- Never accept immediately (even if it's good)\n- Say: 'I appreciate the offer, let me think about it'\n- Wait 24-48 hours before responding\n- Counter with a price 5-8% below your listing price\n\nStep 5: Counter Negotiation\n- Move in small increments (1-2 lakh at a time)\n- Never drop more than 3% in one go\n- Use phrases like:\n  'This is the best I can do'\n  'I have other interested buyers at this range'\n  'The market rate in this area is actually higher'\n\nStep 6: Closing the Deal\n- Once agreed on price, get TOKEN ADVANCE immediately\n- Token amount: 1-2% of sale price\n- Get it in writing with a receipt\n- Set clear timeline for registration (30-45 days)\n- Hire a lawyer to prepare the sale agreement\n\nGolden Rules:\n- Be patient. The right buyer will come.\n- Never show desperation.\n- Everything in writing. No verbal promises.\n- Keep emotions out. This is a business deal.",
  market: "MARKET ANALYSIS - Step-by-Step Guide to Understanding Your Market:\n\nStep 1: Check Current Demand in Your Area\n- Search your area on BhoomiTayi\n- Count how many similar listings exist\n- Less than 10 = Low supply (you can price higher!)\n- 10-30 = Moderate (price competitively)\n- 30+ = High supply (price aggressively to stand out)\n\nStep 2: Current Market Trends (2026)\n- Tier-1 cities (Bangalore, Hyderabad, Chennai): +8-12% YoY\n- Tier-2 cities (Mysore, Vizag, Coimbatore): +12-18% YoY\n- Land prices: Appreciating fastest at 10-15% YoY\n- PG/Rental: Booming near IT parks & colleges\n- Commercial: Strong demand near metro corridors\n\nStep 3: Seasonal Strategy\n- Oct-Jan (BEST): Festival season, highest buyer activity\n- Jan-Mar (GOOD): Financial year-end, tax planning purchases\n- Apr-Jun (MODERATE): New financial year, moderate activity\n- Jul-Sep (SLOW): Monsoon, fewer site visits\n\nStep 4: Your Action Plan\nIf market is HOT (high demand):\n- Price 5-10% above market average\n- Don't rush to accept first offer\n- Multiple offers = leverage for better price\n\nIf market is SLOW (low demand):\n- Price at or slightly below market average\n- Offer incentives (free parking, included fixtures)\n- Highlight urgency: 'Ready for immediate registration'\n\nStep 5: Monitor Your Listing\n- Track inquiry count weekly\n- 0-2 inquiries/week = Lower price by 3-5%\n- 3-5 inquiries/week = Perfect pricing!\n- 10+ inquiries/week = You might be underpriced\n\nWant me to analyze a specific area or property type?",
  documents: "DOCUMENT CHECKLIST - Complete Step-by-Step Guide:\n\nStep 1: Essential Documents (GET THESE FIRST)\n[ ] Original Sale Deed (the most important document)\n    - Where to get: You should already have this\n    - If lost: Apply at Sub-Registrar Office for certified copy\n\n[ ] Title Deed / Chain of Documents\n    - Shows complete ownership history\n    - Must trace back at least 30 years\n    - Get a lawyer to verify the chain\n\n[ ] Encumbrance Certificate (EC)\n    - Where to get: Sub-Registrar Office\n    - Get for last 13-30 years\n    - Fee: Rs 100-500\n    - Time: 3-7 working days\n    - This proves no loans/legal disputes on property\n\nStep 2: Property Tax Documents\n[ ] Khata Certificate\n    - Where to get: BBMP/Local Municipality Office\n    - Shows property is in your name in govt records\n\n[ ] Khata Extract\n    - Where to get: Same office as above\n    - Shows property details (area, location)\n\n[ ] Latest Tax Paid Receipt\n    - Pay all pending property taxes first!\n    - Get receipts for last 3 years minimum\n\nStep 3: Building/Construction Documents\n[ ] Building Plan Approval\n    - Original approved plan from BDA/BBMP\n    - Must match actual construction\n\n[ ] Occupancy Certificate (OC)\n    - Proves building is fit for occupancy\n    - Where to get: Local planning authority\n\n[ ] Completion Certificate (CC)\n    - Proves construction is complete as per approved plan\n\nStep 4: Identity & Other Documents\n[ ] Your ID Proof (Aadhaar, PAN, Passport)\n[ ] Address Proof\n[ ] 2 Passport-size Photographs\n[ ] Power of Attorney (if selling on behalf of someone)\n[ ] NOC from Housing Society (if apartment)\n[ ] NOC from Bank (if property has existing loan)\n\nStep 5: Before Listing\n- Get ALL documents photocopied (2 sets)\n- Store originals safely\n- Share only photocopies with interested buyers\n- Get a lawyer to verify everything before listing\n\nMissing any document? Tell me which one and I'll guide you on how to get it!",
  description: "WRITING THE PERFECT LISTING DESCRIPTION - Step by Step:\n\nStep 1: The Title (Most Important!)\n- Keep it under 60 characters\n- Include: Type + Size + Location\n- Good examples:\n  '3BHK Villa with Garden in JP Nagar'\n  '30x40 Corner Plot near Ring Road'\n  'Furnished Office Space in MG Road'\n- Bad examples:\n  'Property for sale' (too vague)\n  'Beautiful amazing luxury...' (too salesy)\n\nStep 2: Opening Line (The Hook)\n- Lead with your BEST feature\n- Examples:\n  'East-facing 3BHK with stunning city views...'\n  'Ready-to-register BBMP-approved corner site...'\n  'Fully furnished commercial space with 50+ parking...'\n\nStep 3: Property Details (The Facts)\nWrite these in order:\n- Total area (sq.ft / cents / acres / dimensions)\n- Number of rooms (BHK for houses)\n- Floor number & total floors\n- Facing direction\n- Age of property\n- Furnishing status\n\nStep 4: Features & Amenities\nList all that apply:\n- Parking (covered/open, how many)\n- Water supply (borewell/corporation/both)\n- Power backup (generator/inverter)\n- Security (CCTV, gated, watchman)\n- Gym, swimming pool, club house\n- Garden, terrace, balcony\n- Modular kitchen, wardrobes\n\nStep 5: Location & Connectivity\n- Nearest landmark & distance\n- Distance to bus stop / metro\n- Nearby schools, hospitals, malls\n- Distance to main road / highway\n- IT park / business district proximity\n\nStep 6: Call to Action\nEnd with:\n'Contact now for site visit'\n'Available for immediate registration'\n'Price negotiable for serious buyers'\n\nTemplate:\n'[Type] [Size] [Location]. [Best feature]. [BHK/Rooms], [Floor], [Facing]-facing. [Area] sq.ft. [Amenities]. Near [Landmarks]. [Price detail]. Contact for site visit.'\n\nWant me to help write a description for your specific property?",
  timing: "BEST TIME TO SELL - Strategic Step-by-Step Planning:\n\nStep 1: Understand the Market Calendar\n\nPEAK SEASON (Oct - Jan):\n- Dussehra to New Year = HIGHEST buyer activity\n- NRI buyers active during December holidays\n- Festival sentiment = People buy homes\n- Action: List by September to catch the wave!\n\nGOOD SEASON (Jan - Mar):\n- Financial year-end tax planning\n- Companies give bonuses in March\n- Buyers want to close before Apr 1\n- Action: Great for premium properties\n\nMODERATE (Apr - Jun):\n- New financial year starts\n- People settle into new budgets\n- Summer heat reduces site visits\n- Action: Lower competition, fewer listings\n\nSLOW (Jul - Sep):\n- Monsoon season\n- Fewer site visits due to rain\n- Buyers are still researching\n- Action: List now at a slight discount for serious buyers\n\nStep 2: Weekly Strategy\n- List on Thursday/Friday (people browse on weekends)\n- Respond to inquiries within 1 hour\n- Schedule site visits for Saturday/Sunday mornings\n- Follow up with interested buyers every 3-4 days\n\nStep 3: Your Selling Timeline\nWeek 1-2: Prepare documents & photos\nWeek 3: Create listing on BhoomiTayi\nWeek 4-6: Respond to inquiries, schedule visits\nWeek 7-8: Negotiate with serious buyers\nWeek 9-10: Finalize deal, collect token\nWeek 11-12: Complete registration\n\nTotal estimated time: 2-3 months for a well-priced property\n\nStep 4: Red Flags - When NOT to Sell\n- During elections (market uncertainty)\n- Right after a rate hike by RBI\n- During any local disputes/protests\n- When your documents aren't ready\n\nReady to sell? Start with Step 1 - prepare your documents!",
  help: "I'm Tommy, your step-by-step selling guide! Here's everything I can help you with:\n\n1. LISTING GUIDE - Complete walkthrough from start to finish\n   Type: 'How to list' or 'create listing'\n\n2. PRICING STRATEGY - Calculate the perfect price\n   Type: 'pricing' or 'how to price'\n\n3. PHOTOGRAPHY GUIDE - Take professional-looking photos\n   Type: 'photo tips' or 'photography guide'\n\n4. DESCRIPTION WRITING - Craft compelling listings\n   Type: 'description' or 'how to write'\n\n5. NEGOTIATION PLAYBOOK - Close deals like a pro\n   Type: 'negotiation' or 'how to negotiate'\n\n6. MARKET ANALYSIS - Understand current trends\n   Type: 'market' or 'trends'\n\n7. DOCUMENT CHECKLIST - Everything you need ready\n   Type: 'documents' or 'checklist'\n\n8. TIMING STRATEGY - When to sell for max profit\n   Type: 'best time' or 'when to sell'\n\nEvery topic comes with detailed step-by-step instructions. Just pick one!",
  default: "I'm Tommy, your step-by-step selling guide! I provide detailed instructions for everything.\n\nQuick menu - type any of these:\n\n1. 'list' - Full listing walkthrough\n2. 'price' - Pricing strategy guide\n3. 'photo' - Photography step-by-step\n4. 'description' - Writing guide\n5. 'negotiate' - Negotiation playbook\n6. 'market' - Market analysis\n7. 'documents' - Document checklist\n8. 'timing' - When to sell\n9. 'help' - See all topics\n\nWhat would you like detailed instructions on?",
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
          <div className="size-12 rounded-xl overflow-hidden shadow-lg shadow-orange-500/25 ring-2 ring-orange-400">
            <Image src={TOMMY_AVATAR} alt="Tommy" width={48} height={48} className="size-full object-cover" />
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
            <div className="size-10 rounded-full overflow-hidden ring-2 ring-white/30">
              <Image src={TOMMY_AVATAR} alt="Tommy" width={40} height={40} className="size-full object-cover" />
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
                  <div className="flex-shrink-0 size-8 rounded-full overflow-hidden">
                    <Image src={TOMMY_AVATAR} alt="Tommy" width={32} height={32} className="size-full object-cover" />
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
                <div className="flex-shrink-0 size-8 rounded-full overflow-hidden">
                  <Image src={TOMMY_AVATAR} alt="Tommy" width={32} height={32} className="size-full object-cover" />
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
