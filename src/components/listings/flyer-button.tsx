"use client";

import { useEffect, useState, useRef } from "react";
import { FileImage, ChevronLeft, ChevronRight, Download, Eye, Sparkles, Sliders, Type, Grid, Undo2, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Listing } from "@/lib/types/database";

// Define the 10 distinct pamphlet templates
export interface DesignPreset {
  id: string;
  name: string;
  primary: string;
  accent: string;
  bg: string;
  textPrimary: string;
  fontTitle: string;
  fontBody: string;
  clipPath: string;
  styleClass: string;
}

const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "classic-bhoomitayi",
    name: "🌸 BhoomiTayi Classic",
    primary: "#0C4524", // Forest Green
    accent: "#E05A16", // Bright Orange
    bg: "#FAF6F0", // Warm Ivory
    textPrimary: "#333333",
    fontTitle: "'Arial Black', Impact, sans-serif",
    fontBody: "system-ui, sans-serif",
    clipPath: "ellipse(100% 75% at 50% 20%)",
    styleClass: "classic"
  },
  {
    id: "modern-minimalist",
    name: "✨ Modern Minimalist",
    primary: "#1E293B", // Slate
    accent: "#475569", // Cool Grey
    bg: "#F8FAFC", // Ice White
    textPrimary: "#0F172A",
    fontTitle: "'Times New Roman', Georgia, serif",
    fontBody: "Georgia, serif",
    clipPath: "rect(0px, 1080px, 420px, 0px)",
    styleClass: "minimalist"
  },
  {
    id: "sunset-gold",
    name: "👑 Sunset Gold Luxury",
    primary: "#3B0764", // Royal Purple
    accent: "#D97706", // Amber Gold
    bg: "#FFFDF5", // Warm Gold
    textPrimary: "#1E1B4B",
    fontTitle: "Georgia, 'Playfair Display', serif",
    fontBody: "system-ui, sans-serif",
    clipPath: "polygon(0 0, 100% 0, 100% 85%, 0 100%)",
    styleClass: "luxury"
  },
  {
    id: "neon-cyber",
    name: "⚡ Neon Cyber Grid",
    primary: "#09090B", // Dark Zinc
    accent: "#06B6D4", // Neon Cyan
    bg: "#080C14", // Tech Dark Blue
    textPrimary: "#E2E8F0",
    fontTitle: "monospace",
    fontBody: "monospace",
    clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 90%)",
    styleClass: "cyberpunk"
  },
  {
    id: "royal-emerald",
    name: "🏰 Royal Emerald Premium",
    primary: "#064E3B", // Deep Emerald
    accent: "#EAB308", // Bright Gold
    bg: "#F4FDF9", // Mint Ice
    textPrimary: "#064E3B",
    fontTitle: "'Times New Roman', Georgia, serif",
    fontBody: "Georgia, serif",
    clipPath: "ellipse(95% 80% at 50% 15%)",
    styleClass: "royal"
  },
  {
    id: "rustic-organic",
    name: "🍃 Organic Forest Eco",
    primary: "#2D4A22", // Leaf Green
    accent: "#B45309", // Warm Brown
    bg: "#F7F5EE", // Vintage Parchment
    textPrimary: "#1C2E16",
    fontTitle: "'Georgia', serif",
    fontBody: "'Georgia', serif",
    clipPath: "ellipse(120% 70% at 50% 25%)",
    styleClass: "rustic"
  },
  {
    id: "playful-pastel",
    name: "🦄 Bubblegum Pastel",
    primary: "#DB2777", // Hot Pink
    accent: "#0EA5E9", // Sky Blue
    bg: "#FEF2F2", // Baby Pink Tint
    textPrimary: "#4D0620",
    fontTitle: "'Arial Rounded MT Bold', sans-serif",
    fontBody: "system-ui, sans-serif",
    clipPath: "ellipse(90% 85% at 50% 15%)",
    styleClass: "pastel"
  },
  {
    id: "bold-corporate",
    name: "💼 Bold Corporate Clean",
    primary: "#1E3A8A", // Deep Navy
    accent: "#F59E0B", // Bright Yellow
    bg: "#F1F5F9", // Slate Grey
    textPrimary: "#1E293B",
    fontTitle: "system-ui, sans-serif",
    fontBody: "system-ui, sans-serif",
    clipPath: "polygon(0 0, 100% 0, 100% 90%, 0 75%)",
    styleClass: "corporate"
  },
  {
    id: "vintage-heritage",
    name: "📜 Heritage Sepia",
    primary: "#451A03", // Vintage Brown
    accent: "#9A3412", // Terracotta
    bg: "#EFE5C9", // Sepia Paper
    textPrimary: "#291305",
    fontTitle: "'Courier New', Courier, monospace",
    fontBody: "Georgia, serif",
    clipPath: "rect(0px, 1080px, 390px, 0px)",
    styleClass: "vintage"
  },
  {
    id: "crimson-industrial",
    name: "🚨 Crimson Industrial",
    primary: "#7F1D1D", // Dark Red
    accent: "#DC2626", // Red
    bg: "#111827", // Dark Gray
    textPrimary: "#F9FAFB",
    fontTitle: "system-ui, Impact, sans-serif",
    fontBody: "system-ui, sans-serif",
    clipPath: "polygon(0 0, 100% 0, 92% 82%, 8% 95%)",
    styleClass: "industrial"
  }
];

const getCorsSafeUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("data:")) return url; // base64 is already safe
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}cb=${Date.now()}`;
};

export function FlyerButton({ listing }: { listing: Listing }) {
  const [url, setUrl] = useState("");
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);

  // Styling States
  const [selectedDesignId, setSelectedDesignId] = useState("classic-bhoomitayi");
  const [customPrimaryColor, setCustomPrimaryColor] = useState("");
  const [customAccentColor, setCustomAccentColor] = useState("");
  const [customBgColor, setCustomBgColor] = useState("");
  const [handwritingFont, setHandwritingFont] = useState("'Dancing Script', cursive");
  const [downloadImg1Base64, setDownloadImg1Base64] = useState<string | null>(null);
  const [downloadImg2Base64, setDownloadImg2Base64] = useState<string | null>(null);
  const [downloadImg3Base64, setDownloadImg3Base64] = useState<string | null>(null);
  const [logoB64, setLogoB64] = useState<string | null>(null);

  // Zooming & Positioning States
  const [zoom, setZoom] = useState(1.1);
  const [flyerLayout, setFlyerLayout] = useState<"classic" | "split" | "minimalist" | "collage">("classic");
  const [customTextColor, setCustomTextColor] = useState("");
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Customized Text States
  const [titleLine1, setTitleLine1] = useState("");
  const [titleLine2, setTitleLine2] = useState("");
  const [tagline, setTagline] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [footerText, setFooterText] = useState("");

  // Feature Badge States
  const [badge1Emoji, setBadge1Emoji] = useState("🏫");
  const [badge1Text, setBadge1Text] = useState("Near Main Road");
  const [badge2Emoji, setBadge2Emoji] = useState("🛣️");
  const [badge2Text, setBadge2Text] = useState("Good Access");
  const [badge3Emoji, setBadge3Emoji] = useState("🌳");
  const [badge3Text, setBadge3Text] = useState("Peaceful Locality");
  const [badge4Emoji, setBadge4Emoji] = useState("📈");
  const [badge4Text, setBadge4Text] = useState("Great Investment");

  useEffect(() => {
    setUrl(window.location.href);

    // Initial default title based on listing details
    let initialLine1 = "PLOT";
    if (listing.category === "house") initialLine1 = "HOUSE";
    else if (listing.category === "pg") initialLine1 = "ROOMS";
    else if (listing.category === "commercial") initialLine1 = "OFFICE";
    else if (listing.category === "vehicle") initialLine1 = "VEHICLE";
    else if (listing.category === "commodity") initialLine1 = "COMMODITY";

    setTitleLine1(initialLine1);
    setTitleLine2(listing.transaction_type === "rent" ? "FOR RENT" : "FOR SALE");
    setCustomAddress(listing.address || "Puttur, Dakshina Kannada");
    setTagline(
      listing.category === "land"
        ? "A perfect spot to build your dream home!"
        : "A premium property in a highly demanded neighborhood!"
    );
    setFooterText("Build your future in the right place!");
  }, [listing]);

  const activePreset = DESIGN_PRESETS.find((p) => p.id === selectedDesignId) || DESIGN_PRESETS[0];

  // Resolve active color palette
  const primaryColor = customPrimaryColor || activePreset.primary;
  const accentColor = customAccentColor || activePreset.accent;
  const bgColor = customBgColor || activePreset.bg;
  const textColor = customTextColor || activePreset.textPrimary;

  const images = listing.images && listing.images.length > 0 ? listing.images : ["/placeholder.jpg"];

  const fetchImageAsBase64 = async (imgUrl: string): Promise<string> => {
    if (!imgUrl) return "";
    if (imgUrl.startsWith("data:")) return imgUrl;
    
    const targetUrl = imgUrl.startsWith("/") 
      ? window.location.origin + imgUrl
      : `${window.location.origin}/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;

    try {
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Error pre-loading image:", imgUrl, err);
      return imgUrl;
    }
  };

  const handleDownload = async () => {
    if (!flyerRef.current) return;
    setLoading(true);
    const toastId = toast.loading("Preparing flyer...");

    try {
      toast.loading("Loading images...", { id: toastId });
      
      const img1B64 = await fetchImageAsBase64(images[selectedImgIndex]);
      setDownloadImg1Base64(img1B64);

      if (flyerLayout === "collage") {
        const img2B64 = await fetchImageAsBase64(images[(selectedImgIndex + 1) % images.length]);
        const img3B64 = await fetchImageAsBase64(images[(selectedImgIndex + 2) % images.length]);
        setDownloadImg2Base64(img2B64);
        setDownloadImg3Base64(img3B64);
      }

      const logoBase64 = await fetchImageAsBase64("/logo-v2.png");
      setLogoB64(logoBase64);

      toast.loading("Rendering flyer...", { id: toastId });
      
      // Wait for React to apply the base64 srcs to the DOM and for the browser to paint
      await new Promise((r) => setTimeout(r, 600));

      // Temporarily ensure flyerRef is inside the viewport layout but hidden behind other elements
      // This solves the dark rectangle bug with html-to-image on offscreen elements.
      const prevPosition = flyerRef.current.style.position;
      const prevLeft = flyerRef.current.style.left;
      const prevZIndex = flyerRef.current.style.zIndex;
      
      flyerRef.current.style.position = "fixed";
      flyerRef.current.style.left = "0px";
      flyerRef.current.style.top = "0px";
      flyerRef.current.style.zIndex = "-9999";

      // Allow paint
      await new Promise((r) => setTimeout(r, 200));

      const dataUrl = await toPng(flyerRef.current, {
        cacheBust: true,
        pixelRatio: 2.2,
      });

      // Restore position
      flyerRef.current.style.position = prevPosition;
      flyerRef.current.style.left = prevLeft;
      flyerRef.current.style.zIndex = prevZIndex;

      const link = document.createElement("a");
      link.download = `${listing.title.replace(/\s+/g, "_")}_Flyer.png`;
      link.href = dataUrl;
      link.click();
      toast.success("✅ Flyer downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Flyer download error:", error);
      toast.error("❌ Export failed. Please try again.", { id: toastId });
    } finally {
      // Clean up states
      setDownloadImg1Base64(null);
      setDownloadImg2Base64(null);
      setDownloadImg3Base64(null);
      setLogoB64(null);
      setLoading(false);
    }
  };


  const handleResetColors = () => {
    setCustomPrimaryColor("");
    setCustomAccentColor("");
    setCustomBgColor("");
    setCustomTextColor("");
    toast.success("Colors reset to preset defaults!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" title="Generate Pamphlet Flyer" className="gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-300 dark:border-zinc-700 shadow-sm transition-transform active:scale-[0.98]">
          <FileImage className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline text-xs font-bold text-zinc-700 dark:text-zinc-300">Flyer</span>
        </Button>
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="max-w-[95vw] md:max-w-[1080px] h-[92vh] max-h-[92vh] md:max-h-[800px] p-0 flex flex-col overflow-hidden bg-white border border-zinc-200 shadow-2xl rounded-3xl dark:bg-zinc-950 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
        
        {/* Google Fonts Import encapsulated inside dialog */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Pacifico&family=Caveat:wght@700&family=Satisfy&family=Great+Vibes&display=swap');
        `}</style>

        {/* Dynamic header styling */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-row justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Sparkles className="size-5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight">Pamphlet Flyer Studio</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Customize, zoom, change designs, and export without API limits.</p>
            </div>
          </div>

          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
              <X className="size-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* Studio Workspace */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* LEFT SIDE PANEL: SCROLLABLE CONTROLS */}
          <div className="w-full md:w-[420px] border-r border-zinc-150 dark:border-zinc-800 flex flex-col bg-zinc-50/30 dark:bg-zinc-900/10 overflow-hidden h-full shrink-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Template Presets */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                <Grid className="size-4 text-emerald-500" />
                1. Select Design Theme
              </div>
              <Select value={selectedDesignId} onValueChange={(val) => {
                setSelectedDesignId(val);
                // Clear color overrides so preset colors apply
                setCustomPrimaryColor("");
                setCustomAccentColor("");
                setCustomBgColor("");
              }}>
                <SelectTrigger className="rounded-xl h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-medium">
                  <SelectValue placeholder="Select Theme" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  {DESIGN_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Flyer Layout Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                <Grid className="size-4 text-emerald-500" />
                1.5 Choose Flyer Layout Structure
              </div>
              <Select value={flyerLayout} onValueChange={(v) => setFlyerLayout(v as any)}>
                <SelectTrigger className="rounded-xl h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-medium">
                  <SelectValue placeholder="Select Layout Structure" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="classic" className="font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                    Classic Banner Top
                  </SelectItem>
                  <SelectItem value="split" className="font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                    Split-Screen Side-by-Side
                  </SelectItem>
                  <SelectItem value="minimalist" className="font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                    Minimalist Editorial Magazine
                  </SelectItem>
                  <SelectItem value="collage" className="font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                    Dynamic Multi-Photo Collage
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Color Tuning */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  <Sliders className="size-4 text-emerald-500" />
                  2. Customize Colors
                </div>
                {(customPrimaryColor || customAccentColor || customBgColor) && (
                  <button onClick={handleResetColors} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                    <Undo2 className="size-3" /> Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Primary</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setCustomPrimaryColor(e.target.value)}
                      className="w-8 h-8 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer bg-white dark:bg-zinc-900 p-0.5"
                    />
                    <span className="text-[9px] font-mono select-all truncate max-w-[42px]">{primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Accent</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setCustomAccentColor(e.target.value)}
                      className="w-8 h-8 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer bg-white dark:bg-zinc-900 p-0.5"
                    />
                    <span className="text-[9px] font-mono select-all truncate max-w-[42px]">{accentColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Bg</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-8 h-8 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer bg-white dark:bg-zinc-900 p-0.5"
                    />
                    <span className="text-[9px] font-mono select-all truncate max-w-[42px]">{bgColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Text</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      className="w-8 h-8 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer bg-white dark:bg-zinc-900 p-0.5"
                    />
                    <span className="text-[9px] font-mono select-all truncate max-w-[42px]">{textColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Adjustments */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                <FileImage className="size-4 text-emerald-500" />
                3. Photo Framing & Zoom
              </div>
              
              {/* Photo Selector */}
              <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Choose Image:</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={images.length <= 1}
                    onClick={() => setSelectedImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="size-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-xs font-extrabold px-1 text-center min-w-[48px]">
                    {selectedImgIndex + 1} / {images.length}
                  </span>
                  <button
                    disabled={images.length <= 1}
                    onClick={() => setSelectedImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="size-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Range sliders using native HTML input range with clean styles */}
              <div className="space-y-3.5 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">Zoom Image:</span>
                    <span className="text-emerald-600">{zoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800 accent-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">Pan Horizontal (X Offset):</span>
                    <span className="text-emerald-600">{offsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="5"
                    value={offsetX}
                    onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800 accent-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">Pan Vertical (Y Offset):</span>
                    <span className="text-emerald-600">{offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="5"
                    value={offsetY}
                    onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800 accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Typography Customization */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                <Type className="size-4 text-emerald-500" />
                4. Customize Headline Texts
              </div>
              <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Title (Line 1)</Label>
                  <Input
                    value={titleLine1}
                    onChange={(e) => setTitleLine1(e.target.value.toUpperCase())}
                    placeholder="E.g. PLOT"
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Title (Line 2)</Label>
                  <Input
                    value={titleLine2}
                    onChange={(e) => setTitleLine2(e.target.value.toUpperCase())}
                    placeholder="E.g. FOR SALE"
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Location Pin Text</Label>
                  <Input
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Enter location text..."
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Tagline Paragraph</Label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Enter tagline descriptive paragraph..."
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Handwriting / Callout Font</Label>
                  <Select value={handwritingFont} onValueChange={(val) => setHandwritingFont(val)}>
                    <SelectTrigger className="rounded-xl h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-xs">
                      <SelectValue placeholder="Select Handwriting Font" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-250 dark:border-zinc-800 text-xs z-50">
                      <SelectItem value="'Dancing Script', cursive">Dancing Script</SelectItem>
                      <SelectItem value="'Pacifico', cursive">Pacifico</SelectItem>
                      <SelectItem value="'Caveat', cursive">Caveat Bold</SelectItem>
                      <SelectItem value="'Satisfy', cursive">Satisfy Elegant</SelectItem>
                      <SelectItem value="'Great Vibes', cursive">Great Vibes Luxury</SelectItem>
                      <SelectItem value="'Brush Script MT', cursive">Classic Brush</SelectItem>
                      <SelectItem value="'Segoe Print', cursive">Segoe Print</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Feature Icons Tuning */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                <Sparkles className="size-4 text-emerald-500" />
                5. Customize Features Row
              </div>
              <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs">
                
                {/* Badge 1 */}
                <div className="grid grid-cols-4 gap-2 items-center">
                  <Label className="col-span-1 text-[11px] font-bold text-muted-foreground">Badge 1</Label>
                  <Input
                    value={badge1Emoji}
                    onChange={(e) => setBadge1Emoji(e.target.value)}
                    className="col-span-1 text-center h-8 px-1"
                    placeholder="Emoji"
                  />
                  <Input
                    value={badge1Text}
                    onChange={(e) => setBadge1Text(e.target.value)}
                    className="col-span-2 h-8 text-[11px]"
                    placeholder="Label text"
                  />
                </div>

                {/* Badge 2 */}
                <div className="grid grid-cols-4 gap-2 items-center">
                  <Label className="col-span-1 text-[11px] font-bold text-muted-foreground">Badge 2</Label>
                  <Input
                    value={badge2Emoji}
                    onChange={(e) => setBadge2Emoji(e.target.value)}
                    className="col-span-1 text-center h-8 px-1"
                    placeholder="Emoji"
                  />
                  <Input
                    value={badge2Text}
                    onChange={(e) => setBadge2Text(e.target.value)}
                    className="col-span-2 h-8 text-[11px]"
                    placeholder="Label text"
                  />
                </div>

                {/* Badge 3 */}
                <div className="grid grid-cols-4 gap-2 items-center">
                  <Label className="col-span-1 text-[11px] font-bold text-muted-foreground">Badge 3</Label>
                  <Input
                    value={badge3Emoji}
                    onChange={(e) => setBadge3Emoji(e.target.value)}
                    className="col-span-1 text-center h-8 px-1"
                    placeholder="Emoji"
                  />
                  <Input
                    value={badge3Text}
                    onChange={(e) => setBadge3Text(e.target.value)}
                    className="col-span-2 h-8 text-[11px]"
                    placeholder="Label text"
                  />
                </div>

                {/* Badge 4 */}
                <div className="grid grid-cols-4 gap-2 items-center">
                  <Label className="col-span-1 text-[11px] font-bold text-muted-foreground">Badge 4</Label>
                  <Input
                    value={badge4Emoji}
                    onChange={(e) => setBadge4Emoji(e.target.value)}
                    className="col-span-1 text-center h-8 px-1"
                    placeholder="Emoji"
                  />
                  <Input
                    value={badge4Text}
                    onChange={(e) => setBadge4Text(e.target.value)}
                    className="col-span-2 h-8 text-[11px]"
                    placeholder="Label text"
                  />
                </div>
              </div>
            </div>

            {/* Footer Customizer */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                <Type className="size-4 text-emerald-500" />
                6. Bottom Footer CTA
              </div>
              <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Footer Accent Text</Label>
                  <Input
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Build your future in the right place!"
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            </div>
            {/* Sticky Action Download Footer */}
            <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
              <Button
                onClick={handleDownload}
                disabled={loading}
                className="w-full h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-transform active:scale-[0.97] flex items-center justify-center gap-2"
              >
                <Download className="size-5" />
                {loading ? "Exporting High-Res..." : "Download Free Pamphlet"}
              </Button>
            </div>

          </div>

          {/* RIGHT SIDE PANEL: DYNAMIC LIVE PREVIEW */}
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none border-t md:border-t-0 border-zinc-200 dark:border-zinc-850">
            
            {/* Decorative background grid elements */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 z-10">
              <Eye className="size-4 text-emerald-500" /> Live Editor Preview (Scale Fit)
            </div>

            {/* LIVE PREVIEW COMPONENT VIEWPORT CONTAINER (Clamped to 360px inside browser workspace) */}
            <div className="w-[360px] h-[360px] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col justify-between shrink-0 select-none scale-[1.0] transition-all origin-center z-10 bg-white" style={{ backgroundColor: bgColor }}>
              
              {/* Scale down factor = 360 / 1080 = 0.333333 */}
              <div 
                className={`w-[1080px] h-[1080px] scale-[0.33333] origin-top-left absolute top-0 left-0 flex flex-col justify-between overflow-hidden design-style-${activePreset.styleClass}`} 
                style={{ 
                  color: activePreset.textPrimary,
                  fontFamily: activePreset.fontBody,
                  backgroundColor: bgColor
                }}
              >
                {flyerLayout === "classic" && (
                  <>
                    {/* 1. Header Hero image masked */}
                    <div 
                      className="relative w-full h-[420px] overflow-hidden bg-zinc-200 shrink-0" 
                      style={{ clipPath: activePreset.clipPath }}
                    >
                      <img
                        src={images[selectedImgIndex]}
                        alt="Property"
                        className="w-full h-full object-cover origin-center"
                        style={{
                          transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
                        }}
                      />

                      {/* Unconditional circular logo container in hero */}
                      <div className="absolute top-6 left-6 w-48 h-48 bg-white rounded-full border-[6px] border-amber-400 dark:border-amber-500 shadow-2xl flex items-center justify-center overflow-hidden z-20">
                        <img 
                          src="/logo-v2.png" 
                          alt="Logo" 
                          className="w-full h-full object-cover rounded-full" 
                        />
                      </div>
                    </div>

                    {/* Decorative absolute background elements for specific designs */}
                    {activePreset.styleClass === "classic" && (
                      <div className="absolute bottom-36 right-6 text-6xl opacity-30 select-none pointer-events-none">🌸</div>
                    )}
                    {activePreset.styleClass === "luxury" && (
                      <div className="absolute top-[440px] right-6 text-4xl text-[#D97706] animate-pulse opacity-40">✨</div>
                    )}
                    {activePreset.styleClass === "rustic" && (
                      <div className="absolute bottom-[240px] left-12 text-6xl text-emerald-800/10 pointer-events-none">🌿</div>
                    )}
                    {activePreset.styleClass === "cyberpunk" && (
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-30" />
                    )}
                    {activePreset.styleClass === "pastel" && (
                      <div className="absolute top-[460px] left-12 w-24 h-24 rounded-full bg-pink-300/10 blur-xl pointer-events-none" />
                    )}

                    {/* 2. Main Typography and QR Code Segment */}
                    <div className="px-12 flex-1 grid grid-cols-12 gap-4 mt-6 relative z-10 text-left">
                      <div className="col-span-7 flex flex-col justify-start space-y-5">
                        
                        {/* Header titles */}
                        <div className="space-y-1">
                          <h2 
                            className="text-6xl font-black tracking-tight leading-none"
                            style={{ color: primaryColor, fontFamily: activePreset.fontTitle }}
                          >
                            {titleLine1 || "PLOT"}
                          </h2>
                          <h1 
                            className="text-8xl font-black tracking-tighter leading-none"
                            style={{ color: accentColor, fontFamily: activePreset.fontTitle }}
                          >
                            {titleLine2 || "FOR SALE"}
                          </h1>
                        </div>

                        {/* Address details */}
                        <div className="flex items-center gap-3 text-3xl font-extrabold" style={{ color: textColor }}>
                          <span style={{ color: accentColor }} className="text-4xl">📍</span>
                          <span className="truncate max-w-[450px]">{customAddress}</span>
                        </div>

                        {/* Tagline Paragraph Card */}
                        <div 
                          className="py-4 px-6 rounded-r-[2rem] border-l-8 max-w-[500px]"
                          style={{ 
                            backgroundColor: activePreset.styleClass === "cyberpunk" ? "#18181B" : activePreset.styleClass === "industrial" ? "#1F2937" : primaryColor, 
                            color: "#FFFFFF",
                            borderLeftColor: accentColor 
                          }}
                        >
                          <p className="text-2xl font-bold leading-normal">
                            {tagline}
                          </p>
                        </div>
                      </div>

                      {/* QR Code Container on the right */}
                      <div className="col-span-5 relative">
                        <div 
                          className={`absolute right-[-48px] top-[-80px] w-[460px] h-[460px] flex flex-col items-center justify-center p-8 shadow-2xl border-l-[12px] ${
                            activePreset.styleClass === "cyberpunk" ? "rounded-none border-cyan-500 border" : "rounded-full"
                          }`}
                          style={{ 
                            backgroundColor: activePreset.styleClass === "cyberpunk" ? "#0F172A" : activePreset.styleClass === "industrial" ? "#1F2937" : primaryColor,
                            borderLeftColor: accentColor
                          }}
                        >
                          {/* Floating QR label badge */}
                          <span 
                            className="text-black text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full mb-4 shadow-md"
                            style={{ backgroundColor: accentColor }}
                          >
                            SCAN TO VIEW LOCATION
                          </span>

                          {/* White QR card block */}
                          <div 
                            className={`bg-white p-4 w-56 h-56 flex items-center justify-center shadow-lg ${
                              activePreset.styleClass === "cyberpunk" ? "rounded-none border border-cyan-500" : "rounded-3xl"
                            }`}
                          >
                            {url && (
                              <QRCodeCanvas
                                value={url}
                                size={190}
                                level="Q"
                                fgColor="#000000"
                              />
                            )}
                          </div>

                          {/* bottom subtitle in QR circle */}
                          <span className="text-white text-xs font-bold mt-4 tracking-tight max-w-[280px] text-center truncate w-full">
                            {listing.title}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Bottom Features Row (4 circular items) */}
                    <div className="px-12 grid grid-cols-4 gap-6 my-5 z-10 text-center shrink-0">
                      {[
                        { label: badge1Text, emoji: badge1Emoji },
                        { label: badge2Text, emoji: badge2Emoji },
                        { label: badge3Text, emoji: badge3Emoji },
                        { label: badge4Text, emoji: badge4Emoji },
                      ].map((item, index) => (
                        <div key={index} className="flex flex-col items-center space-y-2">
                          <div 
                            className={`w-16 h-16 border-2 flex items-center justify-center bg-white shadow-md text-3xl transition-transform hover:scale-110 duration-300 ${
                              activePreset.styleClass === "cyberpunk" ? "rounded-none border-cyan-500" : "rounded-full"
                            }`}
                            style={{ borderColor: primaryColor }}
                          >
                            {item.emoji}
                          </div>
                          <span className="text-sm font-extrabold leading-snug truncate w-full max-w-[220px]" style={{ color: textColor }}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {flyerLayout === "split" && (
                  <div className="flex-1 flex flex-row overflow-hidden relative z-10 text-left">
                    <div className="w-[450px] h-full relative overflow-hidden bg-zinc-200 border-r-8 shrink-0" style={{ borderColor: accentColor }}>
                      <img
                        src={images[selectedImgIndex]}
                        alt="Property"
                        className="w-full h-full object-cover"
                        style={{ transform: `scale(${zoom * 1.1}) translate(${offsetX}px, ${offsetY}px)` }}
                      />
                      <div className="absolute bottom-6 left-6 w-36 h-36 bg-white rounded-full border-[4px] border-amber-400 shadow-xl flex items-center justify-center overflow-hidden z-20">
                        <img src="/logo-v2.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 p-10 flex flex-col justify-between h-full bg-transparent">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h2 className="text-5xl font-black tracking-tight leading-none" style={{ color: primaryColor, fontFamily: activePreset.fontTitle }}>
                            {titleLine1 || "PLOT"}
                          </h2>
                          <h1 className="text-7xl font-black tracking-tighter leading-none" style={{ color: accentColor, fontFamily: activePreset.fontTitle }}>
                            {titleLine2 || "FOR SALE"}
                          </h1>
                        </div>
                        <div className="flex items-center gap-2 text-2xl font-extrabold" style={{ color: textColor }}>
                          <span style={{ color: accentColor }}>📍</span>
                          <span className="truncate max-w-[380px]">{customAddress}</span>
                        </div>
                        <div className="py-3 px-5 rounded-xl border-l-4" style={{ backgroundColor: primaryColor + "15", borderLeftColor: accentColor }}>
                          <p className="text-lg font-bold leading-normal" style={{ color: textColor }}>{tagline}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: badge1Text, emoji: badge1Emoji },
                          { label: badge2Text, emoji: badge2Emoji },
                          { label: badge3Text, emoji: badge3Emoji },
                          { label: badge4Text, emoji: badge4Emoji },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-3 bg-white/40 dark:bg-black/20 p-2 rounded-xl border border-zinc-200/50">
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="text-xs font-bold leading-tight truncate" style={{ color: textColor }}>{item.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: primaryColor + "10", borderColor: accentColor + "30" }}>
                        <div className="bg-white p-2 w-28 h-28 rounded-xl flex items-center justify-center shadow-md shrink-0">
                          {url && <QRCodeCanvas value={url} size={96} level="Q" fgColor="#000000" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>Scan to View</p>
                          <p className="text-sm font-black truncate max-w-[200px]" style={{ color: textColor }}>{listing.title}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {flyerLayout === "minimalist" && (
                  <div className="flex-1 flex flex-col justify-between p-12 text-center relative z-10">
                    <div className="space-y-2">
                      <p className="text-xl font-bold tracking-[0.3em] uppercase" style={{ color: accentColor }}>EXCLUSIVE OFFERING</p>
                      <h1 className="text-6xl font-extrabold tracking-tight" style={{ color: primaryColor, fontFamily: activePreset.fontTitle }}>
                        {titleLine1} {titleLine2}
                      </h1>
                      <div className="w-24 h-1 mx-auto my-3" style={{ backgroundColor: accentColor }} />
                      <p className="text-2xl font-medium tracking-wide italic" style={{ color: textColor }}>📍 {customAddress}</p>
                    </div>

                    <div className="my-6 relative mx-auto w-[460px] h-[340px] border-[12px] border-white shadow-xl bg-zinc-200 overflow-hidden shrink-0">
                      <img
                        src={images[selectedImgIndex]}
                        alt="Property"
                        className="w-full h-full object-cover"
                        style={{ transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)` }}
                      />
                      <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-full border-[2px] border-amber-450 shadow-md flex items-center justify-center overflow-hidden z-20">
                        <img src="/logo-v2.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
                      </div>
                    </div>

                    <div className="flex justify-center items-center gap-8 py-3 border-y border-zinc-200/50">
                      {[
                        { label: badge1Text, emoji: badge1Emoji },
                        { label: badge2Text, emoji: badge2Emoji },
                        { label: badge3Text, emoji: badge3Emoji },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-xl">{item.emoji}</span>
                          <span className="text-xs font-bold" style={{ color: textColor }}>{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 text-left">
                      <div className="max-w-[420px] space-y-2">
                        <p className="text-xl font-bold italic" style={{ color: textColor }}>{tagline}</p>
                        <p className="text-xs text-zinc-500">Scan QR Code to examine land classification documents and survey numbers.</p>
                      </div>
                      <div className="bg-white p-3 border border-zinc-200 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                        {url && <QRCodeCanvas value={url} size={110} level="Q" fgColor="#000000" />}
                      </div>
                    </div>
                  </div>
                )}

                {flyerLayout === "collage" && (
                  <div className="flex-1 flex flex-col justify-between relative z-10 text-left">
                    <div className="h-[400px] w-full flex gap-3 p-3 bg-zinc-200/50 border-b-4 shrink-0" style={{ borderColor: accentColor }}>
                      <div className="flex-[2] h-full relative overflow-hidden rounded-xl bg-zinc-200">
                        <img
                          src={images[selectedImgIndex]}
                          alt="Primary"
                          className="w-full h-full object-cover"
                          style={{ transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)` }}
                        />
                        <div className="absolute top-4 left-4 w-24 h-24 bg-white rounded-full border-[3px] border-amber-450 shadow-md flex items-center justify-center overflow-hidden z-20">
                          <img src="/logo-v2.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                      </div>
                      <div className="flex-[1] h-full flex flex-col gap-3">
                        <div className="flex-1 rounded-xl overflow-hidden bg-zinc-300 relative">
                          <img
                            src={images[(selectedImgIndex + 1) % images.length]}
                            alt="Secondary"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 rounded-xl overflow-hidden bg-zinc-300 relative">
                          <img
                            src={images[(selectedImgIndex + 2) % images.length]}
                            alt="Tertiary"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-10 flex flex-col justify-between">
                      <div className="grid grid-cols-12 gap-6 items-start">
                        <div className="col-span-8 space-y-4">
                          <div className="space-y-1">
                            <h2 className="text-4xl font-extrabold tracking-tight leading-none" style={{ color: primaryColor, fontFamily: activePreset.fontTitle }}>
                              {titleLine1 || "PLOT"}
                            </h2>
                            <h1 className="text-6xl font-black tracking-tighter leading-none" style={{ color: accentColor, fontFamily: activePreset.fontTitle }}>
                              {titleLine2 || "FOR SALE"}
                            </h1>
                          </div>
                          <div className="flex items-center gap-2 text-2xl font-bold" style={{ color: textColor }}>
                            <span>📍</span>
                            <span className="truncate max-w-[400px]">{customAddress}</span>
                          </div>
                        </div>

                        <div className="col-span-4 flex flex-col items-end">
                          <div className="bg-white p-3 border border-zinc-200 rounded-2xl flex items-center justify-center shadow-lg w-32 h-32">
                            {url && <QRCodeCanvas value={url} size={104} level="Q" fgColor="#000000" />}
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest text-center w-full">Scan map location</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-4 mt-2">
                        {[
                          { label: badge1Text, emoji: badge1Emoji },
                          { label: badge2Text, emoji: badge2Emoji },
                          { label: badge3Text, emoji: badge3Emoji },
                          { label: badge4Text, emoji: badge4Emoji },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/40 py-2 px-4 rounded-xl border border-zinc-200/50">
                            <span className="text-xl">{item.emoji}</span>
                            <span className="text-xs font-bold leading-none truncate" style={{ color: textColor }}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Bottom Footer Banner bar */}
                <div 
                  className="w-full text-white py-6 px-12 flex justify-between items-center border-t-[8px] text-left shrink-0"
                  style={{ 
                    backgroundColor: activePreset.styleClass === "cyberpunk" ? "#18181B" : activePreset.styleClass === "industrial" ? "#1E293B" : primaryColor,
                    borderTopColor: accentColor 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏡</span>
                    <span className="text-2xl font-extrabold tracking-tight">
                      {footerText}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span 
                      className="text-2xl font-medium"
                      style={{ color: accentColor, fontFamily: handwritingFont }}
                    >
                      Scan the QR code for exact location
                    </span>
                    <span 
                      className="text-4xl leading-none"
                      style={{ color: accentColor }}
                    >
                      ↩
                    </span>
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>

        {/* ── HIDDEN TEMPLATE USED SPECIFICALLY BY HTML2CANVAS FOR FULL QUALITY DOWNLOAD ── */}
        <div
          ref={flyerRef}
          className="absolute -left-[9999px] w-[1080px] h-[1080px] p-0 flex flex-col justify-between overflow-hidden text-black select-none"
          style={{ 
            boxSizing: "border-box", 
            fontFamily: activePreset.fontBody,
            backgroundColor: bgColor
          }}
        >
          {flyerLayout === "classic" && (
            <>
              {/* Top Masked Image and Logo Badge */}
              <div 
                className="relative w-full h-[420px] overflow-hidden bg-zinc-200"
                style={{ clipPath: activePreset.clipPath }}
              >
                <img
                  src={downloadImg1Base64 || images[selectedImgIndex]}
                  alt="Property"
                  className="w-full h-full object-cover origin-center"
                  style={{
                    transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
                  }}
                  crossOrigin="anonymous"
                />

                {/* Unconditional circular logo container in hero */}
                <div className="absolute top-6 left-6 w-48 h-48 bg-white rounded-full border-[6px] border-amber-400 shadow-2xl flex items-center justify-center overflow-hidden z-20">
                  <img 
                    src={logoB64 || getCorsSafeUrl("/logo-v2.png")} 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-full" 
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              {/* Decorative background overlays */}
              {activePreset.styleClass === "classic" && (
                <div className="absolute bottom-36 right-6 text-6xl opacity-35 select-none pointer-events-none">🌸</div>
              )}
              {activePreset.styleClass === "luxury" && (
                <div className="absolute top-[440px] right-6 text-4xl text-[#D97706] opacity-40">✨</div>
              )}
              {activePreset.styleClass === "rustic" && (
                <div className="absolute bottom-[240px] left-12 text-6xl text-emerald-800/10 pointer-events-none">🌿</div>
              )}
              {activePreset.styleClass === "cyberpunk" && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-30" />
              )}

              {/* Core Content */}
              <div className="px-12 flex-1 grid grid-cols-12 gap-4 mt-6 relative z-10 text-left">
                <div className="col-span-7 flex flex-col justify-start space-y-5">
                  <div className="space-y-1">
                    <h2 
                      className="text-6xl font-black tracking-tight leading-none"
                      style={{ color: primaryColor, fontFamily: activePreset.fontTitle }}
                    >
                      {titleLine1 || "PLOT"}
                    </h2>
                    <h1 
                      className="text-8xl font-black tracking-tighter leading-none"
                      style={{ color: accentColor, fontFamily: activePreset.fontTitle }}
                    >
                      {titleLine2 || "FOR SALE"}
                    </h1>
                  </div>
                  <div className="flex items-center gap-3 text-3xl font-extrabold" style={{ color: textColor }}>
                    <span style={{ color: accentColor }} className="text-4xl">📍</span>
                    <span className="truncate max-w-[500px]">{customAddress}</span>
                  </div>
                  <div 
                    className="py-4 px-6 rounded-r-[2rem] border-l-8 max-w-[500px]"
                    style={{ 
                      backgroundColor: activePreset.styleClass === "cyberpunk" ? "#18181B" : activePreset.styleClass === "industrial" ? "#1F2937" : primaryColor, 
                      color: "#FFFFFF",
                      borderLeftColor: accentColor 
                    }}
                  >
                    <p className="text-2xl font-bold leading-normal">
                      {tagline}
                    </p>
                  </div>
                </div>

                {/* Circular QR Section */}
                <div className="col-span-5 relative">
                  <div 
                    className={`absolute right-[-48px] top-[-80px] w-[460px] h-[460px] flex flex-col items-center justify-center p-8 shadow-2xl border-l-[12px] ${
                      activePreset.styleClass === "cyberpunk" ? "rounded-none border-cyan-500 border" : "rounded-full"
                    }`}
                    style={{ 
                      backgroundColor: activePreset.styleClass === "cyberpunk" ? "#0F172A" : activePreset.styleClass === "industrial" ? "#1F2937" : primaryColor,
                      borderLeftColor: accentColor
                    }}
                  >
                    <span 
                      className="text-black text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full mb-4 shadow-md"
                      style={{ backgroundColor: accentColor }}
                    >
                      SCAN TO VIEW LOCATION
                    </span>
                    <div 
                      className={`bg-white p-4 w-56 h-56 flex items-center justify-center shadow-lg ${
                        activePreset.styleClass === "cyberpunk" ? "rounded-none border border-cyan-500" : "rounded-3xl"
                      }`}
                    >
                      {url && (
                        <QRCodeCanvas
                          value={url}
                          size={190}
                          level="Q"
                          fgColor="#000000"
                        />
                      )}
                    </div>
                    <span className="text-white text-xs font-bold mt-4 tracking-tight max-w-[280px] text-center truncate w-full">
                      {listing.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Bottom circular icons */}
              <div className="px-12 grid grid-cols-4 gap-6 my-5 z-10 text-center shrink-0">
                {[
                  { label: badge1Text, emoji: badge1Emoji },
                  { label: badge2Text, emoji: badge2Emoji },
                  { label: badge3Text, emoji: badge3Emoji },
                  { label: badge4Text, emoji: badge4Emoji },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div 
                      className={`w-16 h-16 border-2 flex items-center justify-center bg-white shadow-md text-3xl ${
                        activePreset.styleClass === "cyberpunk" ? "rounded-none border-cyan-500" : "rounded-full"
                      }`}
                      style={{ borderColor: primaryColor }}
                    >
                      {item.emoji}
                    </div>
                    <span className="text-sm font-extrabold leading-snug truncate w-full max-w-[220px]" style={{ color: textColor }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {flyerLayout === "split" && (
            <div className="flex-1 flex flex-row overflow-hidden relative z-10 text-left">
              <div className="w-[450px] h-full relative overflow-hidden bg-zinc-200 border-r-8 shrink-0" style={{ borderColor: accentColor }}>
                <img
                  src={downloadImg1Base64 || images[selectedImgIndex]}
                  alt="Property"
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${zoom * 1.1}) translate(${offsetX}px, ${offsetY}px)` }}
                  crossOrigin="anonymous"
                />
                <div className="absolute bottom-6 left-6 w-36 h-36 bg-white rounded-full border-[4px] border-amber-400 shadow-xl flex items-center justify-center overflow-hidden z-20">
                  <img src={logoB64 || getCorsSafeUrl("/logo-v2.png")} alt="Logo" className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" />
                </div>
              </div>
              <div className="flex-1 p-10 flex flex-col justify-between h-full bg-transparent">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-5xl font-black tracking-tight leading-none" style={{ color: primaryColor, fontFamily: activePreset.fontTitle }}>
                      {titleLine1 || "PLOT"}
                    </h2>
                    <h1 className="text-7xl font-black tracking-tighter leading-none" style={{ color: accentColor, fontFamily: activePreset.fontTitle }}>
                      {titleLine2 || "FOR SALE"}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 text-2xl font-extrabold" style={{ color: textColor }}>
                    <span style={{ color: accentColor }}>📍</span>
                    <span className="truncate max-w-[380px]">{customAddress}</span>
                  </div>
                  <div className="py-3 px-5 rounded-xl border-l-4" style={{ backgroundColor: primaryColor + "15", borderLeftColor: accentColor }}>
                    <p className="text-lg font-bold leading-normal" style={{ color: textColor }}>{tagline}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: badge1Text, emoji: badge1Emoji },
                    { label: badge2Text, emoji: badge2Emoji },
                    { label: badge3Text, emoji: badge3Emoji },
                    { label: badge4Text, emoji: badge4Emoji },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white/45 p-2 rounded-xl border border-zinc-200/50">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-xs font-bold leading-tight truncate" style={{ color: textColor }}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: primaryColor + "10", borderColor: accentColor + "30" }}>
                  <div className="bg-white p-2 w-28 h-28 rounded-xl flex items-center justify-center shadow-md shrink-0">
                    {url && <QRCodeCanvas value={url} size={96} level="Q" fgColor="#000000" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>Scan to View</p>
                    <p className="text-sm font-black truncate max-w-[200px]" style={{ color: textColor }}>{listing.title}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {flyerLayout === "minimalist" && (
            <div className="flex-1 flex flex-col justify-between p-12 text-center relative z-10">
              <div className="space-y-2">
                <p className="text-xl font-bold tracking-[0.3em] uppercase" style={{ color: accentColor }}>EXCLUSIVE OFFERING</p>
                <h1 className="text-6xl font-extrabold tracking-tight" style={{ color: primaryColor, fontFamily: activePreset.fontTitle }}>
                  {titleLine1} {titleLine2}
                </h1>
                <div className="w-24 h-1 mx-auto my-3" style={{ backgroundColor: accentColor }} />
                <p className="text-2xl font-medium tracking-wide italic" style={{ color: textColor }}>📍 {customAddress}</p>
              </div>

              <div className="my-6 relative mx-auto w-[460px] h-[340px] border-[12px] border-white shadow-xl bg-zinc-200 overflow-hidden shrink-0">
                <img
                  src={downloadImg1Base64 || images[selectedImgIndex]}
                  alt="Property"
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)` }}
                  crossOrigin="anonymous"
                />
                <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-full border-[2px] border-amber-400 shadow-md flex items-center justify-center overflow-hidden z-20">
                  <img src={logoB64 || getCorsSafeUrl("/logo-v2.png")} alt="Logo" className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" />
                </div>
              </div>

              <div className="flex justify-center items-center gap-8 py-3 border-y border-zinc-200/50">
                {[
                  { label: badge1Text, emoji: badge1Emoji },
                  { label: badge2Text, emoji: badge2Emoji },
                  { label: badge3Text, emoji: badge3Emoji },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: textColor }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 text-left">
                <div className="max-w-[420px] space-y-2">
                  <p className="text-xl font-bold italic" style={{ color: textColor }}>{tagline}</p>
                  <p className="text-xs text-zinc-500">Scan QR Code to examine land classification documents and survey numbers.</p>
                </div>
                <div className="bg-white p-3 border border-zinc-200 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                  {url && <QRCodeCanvas value={url} size={110} level="Q" fgColor="#000000" />}
                </div>
              </div>
            </div>
          )}

          {flyerLayout === "collage" && (
            <div className="flex-1 flex flex-col justify-between relative z-10 text-left">
              <div className="h-[400px] w-full flex gap-3 p-3 bg-zinc-200/50 border-b-4 shrink-0" style={{ borderColor: accentColor }}>
                <div className="flex-[2] h-full relative overflow-hidden rounded-xl bg-zinc-200">
                  <img
                    src={downloadImg1Base64 || images[selectedImgIndex]}
                    alt="Primary"
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)` }}
                    crossOrigin="anonymous"
                  />
                  <div className="absolute top-4 left-4 w-24 h-24 bg-white rounded-full border-[3px] border-amber-400 shadow-md flex items-center justify-center overflow-hidden z-20">
                    <img src={logoB64 || getCorsSafeUrl("/logo-v2.png")} alt="Logo" className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" />
                  </div>
                </div>
                <div className="flex-[1] h-full flex flex-col gap-3">
                  <div className="flex-1 rounded-xl overflow-hidden bg-zinc-300 relative">
                    <img
                      src={downloadImg2Base64 || images[(selectedImgIndex + 1) % images.length]}
                      alt="Secondary"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden bg-zinc-300 relative">
                    <img
                      src={downloadImg3Base64 || images[(selectedImgIndex + 2) % images.length]}
                      alt="Tertiary"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 p-10 flex flex-col justify-between">
                <div className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-8 space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-extrabold tracking-tight leading-none" style={{ color: primaryColor, fontFamily: activePreset.fontTitle }}>
                        {titleLine1 || "PLOT"}
                      </h2>
                      <h1 className="text-6xl font-black tracking-tighter leading-none" style={{ color: accentColor, fontFamily: activePreset.fontTitle }}>
                        {titleLine2 || "FOR SALE"}
                      </h1>
                    </div>
                    <div className="flex items-center gap-2 text-2xl font-bold" style={{ color: textColor }}>
                      <span>📍</span>
                      <span className="truncate max-w-[400px]">{customAddress}</span>
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col items-end">
                    <div className="bg-white p-3 border border-zinc-200 rounded-2xl flex items-center justify-center shadow-lg w-32 h-32">
                      {url && <QRCodeCanvas value={url} size={104} level="Q" fgColor="#000000" />}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest text-center w-full">Scan map location</span>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4 mt-2">
                  {[
                    { label: badge1Text, emoji: badge1Emoji },
                    { label: badge2Text, emoji: badge2Emoji },
                    { label: badge3Text, emoji: badge3Emoji },
                    { label: badge4Text, emoji: badge4Emoji },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-zinc-100 p-2 rounded-xl border border-zinc-200/50">
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-xs font-bold leading-none truncate" style={{ color: textColor }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer bar */}
          <div 
            className="w-full text-white py-6 px-12 flex justify-between items-center border-t-[8px] text-left shrink-0"
            style={{ 
              backgroundColor: activePreset.styleClass === "cyberpunk" ? "#18181B" : activePreset.styleClass === "industrial" ? "#1E293B" : primaryColor,
              borderTopColor: accentColor 
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏡</span>
              <span className="text-2xl font-extrabold tracking-tight">
                {footerText}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span 
                className="text-2xl font-medium"
                style={{ color: accentColor, fontFamily: handwritingFont }}
              >
                Scan the QR code for exact location
              </span>
              <span 
                className="text-4xl leading-none"
                style={{ color: accentColor }}
              >
                ↩
              </span>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
