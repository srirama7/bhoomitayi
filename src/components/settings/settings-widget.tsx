"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  X,
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Eye,
  Zap,
  Minimize2,
  Type,
  Globe,
  RotateCcw,
  Calculator,
  Maximize,
  Percent,
  Wrench,
  ArrowRightLeft,
  FileSignature,
  Wallet,
  FlaskConical,
  Banknote,
  Ruler,
  Beaker,
  Scale,
  Thermometer,
  Gauge,
  Timer,
  PiggyBank,
  Receipt,
  Umbrella,
  BarChart,
  Tag,
  FileText,
  Target,
  Calendar,
  CalendarDays
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSettingsStore } from "@/lib/settings-store";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { toast } from "sonner";

function ScientificCalculator() {
  const [input, setInput] = useState("");
  const [isRad, setIsRad] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  const calculate = () => {
    if (!input) return;
    try {
      let expr = input;
      // Convert display symbols to eval symbols
      expr = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "Math.PI").replace(/e/g, "Math.E");
      expr = expr.replace(/sin\(/g, "Math.sin(");
      expr = expr.replace(/cos\(/g, "Math.cos(");
      expr = expr.replace(/tan\(/g, "Math.tan(");
      expr = expr.replace(/sin⁻¹\(/g, "Math.asin(");
      expr = expr.replace(/cos⁻¹\(/g, "Math.acos(");
      expr = expr.replace(/tan⁻¹\(/g, "Math.atan(");
      expr = expr.replace(/ln\(/g, "Math.log(");
      expr = expr.replace(/log\(/g, "Math.log10(");
      expr = expr.replace(/√\(/g, "Math.sqrt(");
      expr = expr.replace(/\^/g, "**");
      expr = expr.replace(/EXP/g, "E");
      expr = expr.replace(/%/g, "/100");
      // Note: ! (factorial) and some other advanced parsing is omitted for simplicity of eval
      const res = new Function(`return ${expr}`)();
      if (isNaN(res) || !isFinite(res)) throw new Error("Math Error");
      setInput(String(Number(res.toFixed(8)))); // clean floating point errors
    } catch {
      setInput("Error");
    }
  };

  const handleBtn = (val: string) => {
    if (input === "Error") {
      if (val === "AC") setInput("");
      return;
    }
    
    switch (val) {
      case "AC": setInput(""); break;
      case "Back": setInput(input.slice(0, -1)); break;
      case "=": calculate(); break;
      case "M+": 
        try { setMemory(memory + Number(new Function(`return ${input}`)())); setInput(""); } catch {}
        break;
      case "M-":
        try { setMemory(memory - Number(new Function(`return ${input}`)())); setInput(""); } catch {}
        break;
      case "MR": setInput(input + memory); break;
      case "Ans": setInput(input); break;
      case "RND": setInput(input + Math.random().toFixed(4)); break;
      case "±": setInput(input.startsWith("-") ? input.slice(1) : "-" + input); break;
      
      // Functions
      case "sin": case "cos": case "tan":
      case "sin⁻¹": case "cos⁻¹": case "tan⁻¹":
      case "ln": case "log":
      case "√x": 
        setInput(input + val.replace("x", "") + "("); break;
      
      case "x²": setInput(input + "^2"); break;
      case "x³": setInput(input + "^3"); break;
      case "xʸ": setInput(input + "^"); break;
      case "eˣ": setInput(input + "e^"); break;
      case "10ˣ": setInput(input + "10^"); break;
      case "1/x": setInput(input + "1/("); break;
      case "y√x": setInput(input + "^(1/"); break;
      case "³√x": setInput(input + "^(1/3)"); break;
      case "n!": setInput(input + "!"); break;
      
      default: setInput(input + val);
    }
  };

  const Btn = ({ label, className = "" }: { label: string, className?: string }) => (
    <button 
      onClick={() => handleBtn(label)} 
      className={`h-10 flex items-center justify-center text-xs font-semibold rounded bg-[#2b3a4a] text-slate-200 hover:bg-[#3b4a5a] active:bg-[#4b5a6a] transition-colors ${className}`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-[#1a222c] p-4 rounded-xl shadow-2xl font-mono select-none w-[340px]">
      {/* Display */}
      <div className="bg-[#2b3a4a] px-3 py-4 rounded-lg text-right text-3xl text-white mb-4 flex items-center justify-end overflow-hidden break-all border border-slate-700/50 tracking-wider">
        {input || "0"}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {/* Row 1 */}
        <Btn label="sin" />
        <Btn label="cos" />
        <Btn label="tan" />
        <div className="col-span-2 flex items-center justify-center gap-3 bg-[#2b3a4a] rounded text-[11px] text-slate-300">
          <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!isRad} onChange={() => setIsRad(false)} className="size-3 accent-blue-500" /> Deg</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={isRad} onChange={() => setIsRad(true)} className="size-3 accent-blue-500" /> Rad</label>
        </div>

        {/* Row 2 */}
        <Btn label="sin⁻¹" />
        <Btn label="cos⁻¹" />
        <Btn label="tan⁻¹" />
        <Btn label="π" />
        <Btn label="e" />

        {/* Row 3 */}
        <Btn label="xʸ" />
        <Btn label="x³" />
        <Btn label="x²" />
        <Btn label="eˣ" />
        <Btn label="10ˣ" />

        {/* Row 4 */}
        <Btn label="y√x" />
        <Btn label="³√x" />
        <Btn label="√x" />
        <Btn label="ln" />
        <Btn label="log" />

        {/* Row 5 */}
        <Btn label="(" />
        <Btn label=")" />
        <Btn label="1/x" />
        <Btn label="%" />
        <Btn label="n!" />

        {/* Row 6 */}
        <Btn label="7" className="bg-[#38485c]" />
        <Btn label="8" className="bg-[#38485c]" />
        <Btn label="9" className="bg-[#38485c]" />
        <Btn label="+" />
        <Btn label="Back" className="font-bold text-[11px]" />

        {/* Row 7 */}
        <Btn label="4" className="bg-[#38485c]" />
        <Btn label="5" className="bg-[#38485c]" />
        <Btn label="6" className="bg-[#38485c]" />
        <Btn label="-" />
        <Btn label="Ans" className="font-bold text-[11px]" />

        {/* Row 8 */}
        <Btn label="1" className="bg-[#38485c]" />
        <Btn label="2" className="bg-[#38485c]" />
        <Btn label="3" className="bg-[#38485c]" />
        <Btn label="×" />
        <Btn label="M+" className="font-bold text-[11px]" />

        {/* Row 9 */}
        <Btn label="0" className="bg-[#38485c]" />
        <Btn label="." className="bg-[#38485c]" />
        <Btn label="EXP" className="font-bold text-[11px]" />
        <Btn label="÷" />
        <Btn label="M-" className="font-bold text-[11px]" />

        {/* Row 10 */}
        <Btn label="±" />
        <Btn label="RND" className="font-bold text-[11px]" />
        <Btn label="AC" className="font-bold text-[11px]" />
        <Btn label="=" className="bg-[#305f8f] hover:bg-[#3b71aa] text-white text-lg" />
        <Btn label="MR" className="font-bold text-[11px]" />
      </div>
    </div>
  );
}

export function SettingsWidget() {
  const settings = useSettingsStore();
  const open = settings.isSettingsOpen;
  const setOpen = settings.setSettingsOpen;
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Calculator States
  const [emiData, setEmiData] = useState({ principal: 5000000, down: 20, interest: 8.5, years: 20 });
  const [emiResult, setEmiResult] = useState(0);
  const [unitData, setUnitData] = useState({ value: 1000, from: "sqft", to: "acres" });
  const [unitResult, setUnitResult] = useState(0);
  const [yieldData, setYieldData] = useState({ price: 5000000, rent: 25000 });
  const [yieldResult, setYieldResult] = useState(0);
  const [stampData, setStampData] = useState({ price: 5000000, rate: 5.6 });
  const [stampResult, setStampResult] = useState(0);
  const [affordData, setAffordData] = useState({ income: 100000, emi: 20000, rate: 8.5, years: 20 });
  const [affordResult, setAffordResult] = useState(0);
  
  const [sciInput, setSciInput] = useState("");
  const [sciResult, setSciResult] = useState("");

  const [currencyData, setCurrencyData] = useState({ value: 100, from: "INR", to: "USD" });
  const [currencyResult, setCurrencyResult] = useState(0);

  const [measureData, setMeasureData] = useState({ value: 1, from: "km", to: "miles" });
  const [measureResult, setMeasureResult] = useState(0);

  const [volumeData, setVolumeData] = useState({ value: 1, from: "liters", to: "gallons" });
  const [volumeResult, setVolumeResult] = useState(0);

  const [weightData, setWeightData] = useState({ value: 1, from: "kg", to: "lbs" });
  const [weightResult, setWeightResult] = useState(0);

  const [tempData, setTempData] = useState({ value: 0, from: "c", to: "f" });
  const [tempResult, setTempResult] = useState(0);

  const [speedData, setSpeedData] = useState({ value: 60, from: "kmh", to: "mph" });
  const [speedResult, setSpeedResult] = useState(0);

  const [timeData, setTimeData] = useState({ value: 1, from: "hours", to: "minutes" });
  const [timeResult, setTimeResult] = useState(0);

  const [sipData, setSipData] = useState({ amount: 5000, rate: 12, years: 10 });
  const [sipResult, setSipResult] = useState(0);

  const [taxData, setTaxData] = useState({ income: 1000000, deductions: 150000 });
  const [taxResult, setTaxResult] = useState(0);

  const [retireData, setRetireData] = useState({ currentAge: 30, retireAge: 60, monthlyNeed: 50000, inflation: 6, returnRate: 10 });
  const [retireResult, setRetireResult] = useState(0);

  const [marginData, setMarginData] = useState({ cost: 1000, revenue: 1500 });
  const [marginResult, setMarginResult] = useState(0);

  const [discountData, setDiscountData] = useState({ price: 1000, discountPercent: 20 });
  const [discountResult, setDiscountResult] = useState(0);

  const [gstData, setGstData] = useState({ amount: 1000, rate: 18, type: "exclusive" });
  const [gstResult, setGstResult] = useState({ total: 0, tax: 0 });

  const [breakevenData, setBreakevenData] = useState({ fixedCosts: 50000, pricePerUnit: 100, varCostPerUnit: 40 });
  const [breakevenResult, setBreakevenResult] = useState(0);

  const [ageData, setAgeData] = useState({ dob: "1990-01-01", target: new Date().toISOString().split("T")[0] });
  const [ageResult, setAgeResult] = useState({ years: 0, months: 0, days: 0 });

  const [dateDiffData, setDateDiffData] = useState({ start: new Date().toISOString().split("T")[0], end: new Date().toISOString().split("T")[0] });
  const [dateDiffResult, setDateDiffResult] = useState(0);



  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const updateScroll = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((scrollPx / winHeightPx) * 100);
    };
    window.addEventListener("scroll", updateScroll);
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "Auto", icon: Monitor },
  ];

  const fontSizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
    { value: "xlarge", label: "Extra Large" },
  ] as const;

  const handleReset = () => {
    settings.resetAll();
    setTheme("system");
    toast.success("Settings reset to defaults");
  };

  const calculateEmi = () => {
    const loanAmt = emiData.principal - (emiData.principal * (emiData.down / 100));
    const r = (emiData.interest / 12) / 100;
    const n = emiData.years * 12;
    if (r === 0) {
      setEmiResult(loanAmt / n);
      return;
    }
    const emi = (loanAmt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    setEmiResult(Math.round(emi));
  };

  const convertUnits = () => {
    const sqftValues: Record<string, number> = { sqft: 1, acres: 43560, hectares: 107639, guntas: 1089, cents: 435.6 };
    const inSqft = unitData.value * sqftValues[unitData.from];
    const outVal = inSqft / sqftValues[unitData.to];
    setUnitResult(outVal);
  };

  const calculateYield = () => {
    const annualRent = yieldData.rent * 12;
    const roi = (annualRent / yieldData.price) * 100;
    setYieldResult(Number(roi.toFixed(2)));
  };

  const calculateStamp = () => {
    const duty = yieldData.price * (stampData.rate / 100);
    setStampResult(Math.round(duty));
  };

  const calculateAffordability = () => {
    const maxEmi = (affordData.income * 0.5) - affordData.emi;
    if (maxEmi <= 0) {
      setAffordResult(0);
      return;
    }
    const r = (affordData.rate / 12) / 100;
    const n = affordData.years * 12;
    // maxEmi = P * r * (1+r)^n / ((1+r)^n - 1)
    // P = maxEmi * ((1+r)^n - 1) / (r * (1+r)^n)
    const factor = Math.pow(1 + r, n);
    const maxLoan = maxEmi * (factor - 1) / (r * factor);
    // Add 20% down payment assumption
    const maxHomeValue = maxLoan / 0.8;
    setAffordResult(Math.round(maxHomeValue));
  };

  const calculateSci = () => {
    if (!sciInput.trim()) { setSciResult(""); return; }
    try {
      const res = new Function(`return ${sciInput.replace(/[^0-9+\-*/().]/g, "")}`)();
      setSciResult(String(res));
    } catch {
      setSciResult("Error");
    }
  };

  const calculateCurrency = () => {
    const rates: Record<string, number> = { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, AUD: 1.5, CAD: 1.37 };
    const inUSD = currencyData.value / rates[currencyData.from];
    const outVal = inUSD * rates[currencyData.to];
    setCurrencyResult(Number(outVal.toFixed(2)));
  };

  const calculateMeasure = () => {
    const mValues: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mm: 0.001, miles: 1609.34, yards: 0.9144, feet: 0.3048, inches: 0.0254 };
    const inMeters = measureData.value * mValues[measureData.from];
    const outVal = inMeters / mValues[measureData.to];
    setMeasureResult(Number(outVal.toFixed(4)));
  };

  const calculateVolume = () => {
    const lValues: Record<string, number> = { liters: 1, ml: 0.001, gallons: 3.78541, quarts: 0.946353, pints: 0.473176, cups: 0.24 };
    const inLiters = volumeData.value * lValues[volumeData.from];
    const outVal = inLiters / lValues[volumeData.to];
    setVolumeResult(Number(outVal.toFixed(4)));
  };

  const calculateWeight = () => {
    const kgValues: Record<string, number> = { kg: 1, g: 0.001, lbs: 0.453592, oz: 0.0283495, ton: 1000 };
    const inKg = weightData.value * kgValues[weightData.from];
    const outVal = inKg / kgValues[weightData.to];
    setWeightResult(Number(outVal.toFixed(4)));
  };

  const calculateTemp = () => {
    let inC = tempData.value;
    if (tempData.from === "f") inC = (tempData.value - 32) * 5/9;
    else if (tempData.from === "k") inC = tempData.value - 273.15;
    
    let outVal = inC;
    if (tempData.to === "f") outVal = (inC * 9/5) + 32;
    else if (tempData.to === "k") outVal = inC + 273.15;
    setTempResult(Number(outVal.toFixed(2)));
  };

  const calculateSpeed = () => {
    const msValues: Record<string, number> = { ms: 1, kmh: 0.277778, mph: 0.44704, knots: 0.514444 };
    const inMs = speedData.value * msValues[speedData.from];
    const outVal = inMs / msValues[speedData.to];
    setSpeedResult(Number(outVal.toFixed(2)));
  };

  const calculateTime = () => {
    const sValues: Record<string, number> = { s: 1, minutes: 60, hours: 3600, days: 86400, weeks: 604800 };
    const inS = timeData.value * sValues[timeData.from];
    const outVal = inS / sValues[timeData.to];
    setTimeResult(Number(outVal.toFixed(2)));
  };

  const calculateSip = () => {
    // M = P × ({[1 + i]^n – 1} / i) × (1 + i)
    const P = sipData.amount;
    const i = (sipData.rate / 100) / 12;
    const n = sipData.years * 12;
    const maturity = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    setSipResult(Math.round(maturity));
  };

  const calculateTax = () => {
    // Simplified Old Regime Indian Tax brackets (just for illustration)
    const taxable = Math.max(0, taxData.income - taxData.deductions);
    let tax = 0;
    if (taxable > 1000000) tax += (taxable - 1000000) * 0.3 + 112500;
    else if (taxable > 500000) tax += (taxable - 500000) * 0.2 + 12500;
    else if (taxable > 250000) tax += (taxable - 250000) * 0.05;
    setTaxResult(Math.round(tax));
  };

  const calculateRetire = () => {
    const yearsToRetire = retireData.retireAge - retireData.currentAge;
    if (yearsToRetire <= 0) { setRetireResult(0); return; }
    // Future value of monthly need
    const futureMonthlyNeed = retireData.monthlyNeed * Math.pow(1 + retireData.inflation/100, yearsToRetire);
    // Assuming 20 years of retirement, how much corpus needed (Rule of 25 approx on annual or more complex PV)
    // Simple corpus needed = Future Annual Need * 25 (4% withdrawal rate)
    const corpus = (futureMonthlyNeed * 12) * 25;
    setRetireResult(Math.round(corpus));
  };

  const calculateMargin = () => {
    if (marginData.revenue <= 0) { setMarginResult(0); return; }
    const profit = marginData.revenue - marginData.cost;
    const margin = (profit / marginData.revenue) * 100;
    setMarginResult(Number(margin.toFixed(2)));
  };

  const calculateDiscount = () => {
    const savings = marginData.revenue * (discountData.discountPercent / 100);
    // actually, discount is on discountData.price
    const actualSavings = discountData.price * (discountData.discountPercent / 100);
    const finalPrice = discountData.price - actualSavings;
    setDiscountResult(Number(finalPrice.toFixed(2)));
  };

  const calculateGst = () => {
    let tax = 0;
    let total = 0;
    if (gstData.type === "exclusive") {
      tax = gstData.amount * (gstData.rate / 100);
      total = gstData.amount + tax;
    } else {
      tax = gstData.amount - (gstData.amount * (100 / (100 + gstData.rate)));
      total = gstData.amount;
    }
    setGstResult({ total: Number(total.toFixed(2)), tax: Number(tax.toFixed(2)) });
  };

  const calculateBreakeven = () => {
    const contributionMargin = breakevenData.pricePerUnit - breakevenData.varCostPerUnit;
    if (contributionMargin <= 0) { setBreakevenResult(0); return; }
    const units = breakevenData.fixedCosts / contributionMargin;
    setBreakevenResult(Math.ceil(units));
  };

  const calculateAge = () => {
    if (!ageData.dob || !ageData.target) return;
    const d1 = new Date(ageData.dob);
    const d2 = new Date(ageData.target);
    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    setAgeResult({ years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) });
  };

  const calculateDateDiff = () => {
    if (!dateDiffData.start || !dateDiffData.end) return;
    const d1 = new Date(dateDiffData.start);
    const d2 = new Date(dateDiffData.end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    setDateDiffResult(diffDays);
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-[3px] z-[9999] bg-transparent pointer-events-none">
        <div className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-100 ease-out" style={{ width: `${scrollProgress}%` }} />
      </div>

      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-24 left-6 z-50"
          >
            <Button
              id="settings-widget"
              onClick={() => setOpen(true)}
              className="size-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-600 dark:to-zinc-800 hover:from-zinc-800 hover:to-zinc-950 shadow-xl shadow-black/20 hover:shadow-black/40 transition-all duration-300"
            >
              <motion.div
                animate={{ rotate: open ? 0 : 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Settings className="size-5 text-white" />
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ 
          opacity: open ? 1 : 0, 
          x: open ? 0 : -20, 
          scale: open ? 1 : 0.95,
          pointerEvents: open ? "auto" : "none"
        }}
        transition={{ duration: 0.2 }}
        className="fixed top-24 left-6 z-50 w-[320px] max-w-[calc(100vw-48px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col"
        style={{ height: "600px", maxHeight: "calc(100vh - 120px)" }}
      >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-zinc-700 to-zinc-900 text-white">
              <div className="flex items-center gap-2">
                <Settings className="size-5" />
                <h3 className="font-bold text-sm">Quick Settings</h3>
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

            <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-zinc-100 dark:[&::-webkit-scrollbar-track]:bg-zinc-800/50 [&::-webkit-scrollbar-thumb]:bg-zinc-400 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-500 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500 dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400">
              <div className="p-4 space-y-5">
                
                {/* Real Estate Tools Section */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Wrench className="size-3.5" /> Smart Tools
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    
                    {/* EMI Dialog */}
                    <Dialog open={settings.activeCalculator === "emi"} onOpenChange={(open) => settings.setActiveCalculator(open ? "emi" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600">
                          <Calculator className="mr-2 size-3.5" /> EMI Calc
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>EMI Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Property Price (₹)</Label>
                            <Input type="number" value={emiData.principal} onChange={(e) => setEmiData({...emiData, principal: Number(e.target.value)})} onKeyUp={calculateEmi} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Down Payment (%)</Label>
                              <Input type="number" value={emiData.down} onChange={(e) => setEmiData({...emiData, down: Number(e.target.value)})} onKeyUp={calculateEmi} />
                            </div>
                            <div className="space-y-2">
                              <Label>Interest Rate (%)</Label>
                              <Input type="number" value={emiData.interest} onChange={(e) => setEmiData({...emiData, interest: Number(e.target.value)})} onKeyUp={calculateEmi} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Tenure (Years)</Label>
                            <Input type="number" value={emiData.years} onChange={(e) => setEmiData({...emiData, years: Number(e.target.value)})} onKeyUp={calculateEmi} />
                          </div>
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Estimated Monthly EMI</p>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">₹{emiResult.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Yield Calc */}
                    <Dialog open={settings.activeCalculator === "roi"} onOpenChange={(open) => settings.setActiveCalculator(open ? "roi" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600">
                          <Percent className="mr-2 size-3.5" /> ROI Calc
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Investment ROI Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Property Price (₹)</Label>
                            <Input type="number" value={yieldData.price} onChange={(e) => setYieldData({...yieldData, price: Number(e.target.value)})} onKeyUp={calculateYield} />
                          </div>
                          <div className="space-y-2">
                            <Label>Expected Monthly Rent (₹)</Label>
                            <Input type="number" value={yieldData.rent} onChange={(e) => setYieldData({...yieldData, rent: Number(e.target.value)})} onKeyUp={calculateYield} />
                          </div>
                          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Annual Rental Yield</p>
                            <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{yieldResult}%</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Stamp Duty Calc */}
                    <Dialog open={settings.activeCalculator === "stamp"} onOpenChange={(open) => settings.setActiveCalculator(open ? "stamp" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600">
                          <FileSignature className="mr-2 size-3.5" /> Stamp Duty
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Stamp Duty Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Property Value (₹)</Label>
                            <Input type="number" value={yieldData.price} onChange={(e) => {setYieldData({...yieldData, price: Number(e.target.value)}); setStampData({...stampData, price: Number(e.target.value)})}} onKeyUp={calculateStamp} />
                          </div>
                          <div className="space-y-2">
                            <Label>State Stamp Duty & Reg Rate (%)</Label>
                            <Input type="number" value={stampData.rate} onChange={(e) => setStampData({...stampData, rate: Number(e.target.value)})} onKeyUp={calculateStamp} />
                          </div>
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">Total Stamp Duty & Reg. Fee</p>
                            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">₹{stampResult.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Affordability Calc */}
                    <Dialog open={settings.activeCalculator === "afford"} onOpenChange={(open) => settings.setActiveCalculator(open ? "afford" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600">
                          <Wallet className="mr-2 size-3.5" /> Afford Calc
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Home Affordability Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Monthly Net Income (₹)</Label>
                            <Input type="number" value={affordData.income} onChange={(e) => setAffordData({...affordData, income: Number(e.target.value)})} onKeyUp={calculateAffordability} />
                          </div>
                          <div className="space-y-2">
                            <Label>Existing Monthly EMIs (₹)</Label>
                            <Input type="number" value={affordData.emi} onChange={(e) => setAffordData({...affordData, emi: Number(e.target.value)})} onKeyUp={calculateAffordability} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Interest (%)</Label>
                              <Input type="number" value={affordData.rate} onChange={(e) => setAffordData({...affordData, rate: Number(e.target.value)})} onKeyUp={calculateAffordability} />
                            </div>
                            <div className="space-y-2">
                              <Label>Tenure</Label>
                              <Input type="number" value={affordData.years} onChange={(e) => setAffordData({...affordData, years: Number(e.target.value)})} onKeyUp={calculateAffordability} />
                            </div>
                          </div>
                          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-rose-600 dark:text-rose-400 mb-1">You can afford a home worth approx</p>
                            <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">₹{affordResult.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Area Converter */}
                    <Dialog open={settings.activeCalculator === "area"} onOpenChange={(open) => settings.setActiveCalculator(open ? "area" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full col-span-2 justify-center h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600">
                          <Maximize className="mr-2 size-3.5" /> Land Area Converter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Land Area Converter</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label>Value</Label>
                              <Input type="number" value={unitData.value} onChange={(e) => setUnitData({...unitData, value: Number(e.target.value)})} onKeyUp={convertUnits} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>From</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={unitData.from} onChange={(e) => {setUnitData({...unitData, from: e.target.value}); setTimeout(convertUnits, 10)}}>
                                <option value="sqft">Sq Ft</option><option value="acres">Acres</option><option value="guntas">Guntas</option><option value="cents">Cents</option><option value="hectares">Hectares</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRightLeft className="size-5 text-muted-foreground" /></div>
                          <div className="space-y-2">
                            <Label>To</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={unitData.to} onChange={(e) => {setUnitData({...unitData, to: e.target.value}); setTimeout(convertUnits, 10)}}>
                                <option value="acres">Acres</option><option value="sqft">Sq Ft</option><option value="guntas">Guntas</option><option value="cents">Cents</option><option value="hectares">Hectares</option>
                            </select>
                          </div>
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center mt-4">
                            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{unitResult.toFixed(4)}</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 capitalize">{unitData.to}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* SIP */}
                    <Dialog open={settings.activeCalculator === "sip"} onOpenChange={(open) => settings.setActiveCalculator(open ? "sip" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 hover:text-fuchsia-600">
                          <PiggyBank className="mr-2 size-3.5" /> SIP Calc
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>SIP Investment Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Monthly Investment (₹)</Label>
                            <Input type="number" value={sipData.amount} onChange={(e) => setSipData({...sipData, amount: Number(e.target.value)})} onKeyUp={calculateSip} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Return Rate (%)</Label>
                              <Input type="number" value={sipData.rate} onChange={(e) => setSipData({...sipData, rate: Number(e.target.value)})} onKeyUp={calculateSip} />
                            </div>
                            <div className="space-y-2">
                              <Label>Time Period (Years)</Label>
                              <Input type="number" value={sipData.years} onChange={(e) => setSipData({...sipData, years: Number(e.target.value)})} onKeyUp={calculateSip} />
                            </div>
                          </div>
                          <div className="p-4 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-fuchsia-600 dark:text-fuchsia-400 mb-1">Estimated Maturity Amount</p>
                            <p className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-300">₹{sipResult.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Tax */}
                    <Dialog open={settings.activeCalculator === "tax"} onOpenChange={(open) => settings.setActiveCalculator(open ? "tax" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-slate-900/20 hover:text-slate-600">
                          <Receipt className="mr-2 size-3.5" /> Income Tax
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Income Tax Calculator (Est.)</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Annual Income (₹)</Label>
                            <Input type="number" value={taxData.income} onChange={(e) => setTaxData({...taxData, income: Number(e.target.value)})} onKeyUp={calculateTax} />
                          </div>
                          <div className="space-y-2">
                            <Label>Total Deductions (₹)</Label>
                            <Input type="number" value={taxData.deductions} onChange={(e) => setTaxData({...taxData, deductions: Number(e.target.value)})} onKeyUp={calculateTax} />
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Estimated Tax Liability</p>
                            <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">₹{taxResult.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Retirement */}
                    <Dialog open={settings.activeCalculator === "retirement"} onOpenChange={(open) => settings.setActiveCalculator(open ? "retirement" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full col-span-2 justify-center h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600">
                          <Umbrella className="mr-2 size-3.5" /> Retirement Planner
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Retirement Corpus Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Current Age</Label>
                              <Input type="number" value={retireData.currentAge} onChange={(e) => setRetireData({...retireData, currentAge: Number(e.target.value)})} onKeyUp={calculateRetire} />
                            </div>
                            <div className="space-y-2">
                              <Label>Retirement Age</Label>
                              <Input type="number" value={retireData.retireAge} onChange={(e) => setRetireData({...retireData, retireAge: Number(e.target.value)})} onKeyUp={calculateRetire} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Current Monthly Expense (₹)</Label>
                            <Input type="number" value={retireData.monthlyNeed} onChange={(e) => setRetireData({...retireData, monthlyNeed: Number(e.target.value)})} onKeyUp={calculateRetire} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Inflation (%)</Label>
                              <Input type="number" value={retireData.inflation} onChange={(e) => setRetireData({...retireData, inflation: Number(e.target.value)})} onKeyUp={calculateRetire} />
                            </div>
                            <div className="space-y-2">
                              <Label>Post-Retire Return (%)</Label>
                              <Input type="number" value={retireData.returnRate} onChange={(e) => setRetireData({...retireData, returnRate: Number(e.target.value)})} onKeyUp={calculateRetire} />
                            </div>
                          </div>
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Target Retirement Corpus</p>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">₹{retireResult.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                  </div>
                </div>

                <Separator />

                {/* General Calculators Section */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                    <Calculator className="size-3.5" /> General Calculators
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    
                    {/* Scientific */}
                    <Dialog open={settings.activeCalculator === "scientific"} onOpenChange={(open) => settings.setActiveCalculator(open ? "scientific" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-slate-900/20 hover:text-slate-600">
                          <FlaskConical className="mr-2 size-3.5" /> Scientific
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="p-0 border-none bg-transparent w-auto max-w-none shadow-none focus:outline-none">
                        <ScientificCalculator />
                      </DialogContent>
                    </Dialog>

                    {/* Currency */}
                    <Dialog open={settings.activeCalculator === "currency"} onOpenChange={(open) => settings.setActiveCalculator(open ? "currency" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600">
                          <Banknote className="mr-2 size-3.5" /> Currency
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Currency Converter (Estimated)</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label>Amount</Label>
                              <Input type="number" value={currencyData.value} onChange={(e) => setCurrencyData({...currencyData, value: Number(e.target.value)})} onKeyUp={calculateCurrency} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>From</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={currencyData.from} onChange={(e) => {setCurrencyData({...currencyData, from: e.target.value}); setTimeout(calculateCurrency, 10)}}>
                                <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AUD">AUD</option><option value="CAD">CAD</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRightLeft className="size-5 text-muted-foreground" /></div>
                          <div className="space-y-2">
                            <Label>To</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={currencyData.to} onChange={(e) => {setCurrencyData({...currencyData, to: e.target.value}); setTimeout(calculateCurrency, 10)}}>
                                <option value="USD">USD</option><option value="INR">INR</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AUD">AUD</option><option value="CAD">CAD</option>
                            </select>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl text-center mt-4">
                            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{currencyResult.toLocaleString("en-US")}</p>
                            <p className="text-sm text-green-600 dark:text-green-400">{currencyData.to}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Measurements */}
                    <Dialog open={settings.activeCalculator === "measure"} onOpenChange={(open) => settings.setActiveCalculator(open ? "measure" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600">
                          <Ruler className="mr-2 size-3.5" /> Length
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Length & Measurements Converter</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label>Value</Label>
                              <Input type="number" value={measureData.value} onChange={(e) => setMeasureData({...measureData, value: Number(e.target.value)})} onKeyUp={calculateMeasure} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>From</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={measureData.from} onChange={(e) => {setMeasureData({...measureData, from: e.target.value}); setTimeout(calculateMeasure, 10)}}>
                                <option value="km">Kilometers</option><option value="m">Meters</option><option value="cm">Centimeters</option><option value="mm">Millimeters</option><option value="miles">Miles</option><option value="yards">Yards</option><option value="feet">Feet</option><option value="inches">Inches</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRightLeft className="size-5 text-muted-foreground" /></div>
                          <div className="space-y-2">
                            <Label>To</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={measureData.to} onChange={(e) => {setMeasureData({...measureData, to: e.target.value}); setTimeout(calculateMeasure, 10)}}>
                                <option value="miles">Miles</option><option value="km">Kilometers</option><option value="m">Meters</option><option value="cm">Centimeters</option><option value="mm">Millimeters</option><option value="yards">Yards</option><option value="feet">Feet</option><option value="inches">Inches</option>
                            </select>
                          </div>
                          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl text-center mt-4">
                            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{measureResult.toFixed(4)}</p>
                            <p className="text-sm text-orange-600 dark:text-orange-400 capitalize">{measureData.to}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Volume */}
                    <Dialog open={settings.activeCalculator === "volume"} onOpenChange={(open) => settings.setActiveCalculator(open ? "volume" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600">
                          <Beaker className="mr-2 size-3.5" /> Volume
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Volume Converter</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label>Value</Label>
                              <Input type="number" value={volumeData.value} onChange={(e) => setVolumeData({...volumeData, value: Number(e.target.value)})} onKeyUp={calculateVolume} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>From</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={volumeData.from} onChange={(e) => {setVolumeData({...volumeData, from: e.target.value}); setTimeout(calculateVolume, 10)}}>
                                <option value="liters">Liters</option><option value="ml">Milliliters</option><option value="gallons">Gallons</option><option value="quarts">Quarts</option><option value="pints">Pints</option><option value="cups">Cups</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRightLeft className="size-5 text-muted-foreground" /></div>
                          <div className="space-y-2">
                            <Label>To</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={volumeData.to} onChange={(e) => {setVolumeData({...volumeData, to: e.target.value}); setTimeout(calculateVolume, 10)}}>
                                <option value="gallons">Gallons</option><option value="liters">Liters</option><option value="ml">Milliliters</option><option value="quarts">Quarts</option><option value="pints">Pints</option><option value="cups">Cups</option>
                            </select>
                          </div>
                          <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl text-center mt-4">
                            <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{volumeResult.toFixed(4)}</p>
                            <p className="text-sm text-cyan-600 dark:text-cyan-400 capitalize">{volumeData.to}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Weight */}
                    <Dialog open={settings.activeCalculator === "weight"} onOpenChange={(open) => settings.setActiveCalculator(open ? "weight" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 hover:text-zinc-600">
                          <Scale className="mr-2 size-3.5" /> Weight
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Weight Converter</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label>Value</Label>
                              <Input type="number" value={weightData.value} onChange={(e) => setWeightData({...weightData, value: Number(e.target.value)})} onKeyUp={calculateWeight} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>From</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={weightData.from} onChange={(e) => {setWeightData({...weightData, from: e.target.value}); setTimeout(calculateWeight, 10)}}>
                                <option value="kg">Kilograms</option><option value="g">Grams</option><option value="lbs">Pounds</option><option value="oz">Ounces</option><option value="ton">Tonnes</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRightLeft className="size-5 text-muted-foreground" /></div>
                          <div className="space-y-2">
                            <Label>To</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={weightData.to} onChange={(e) => {setWeightData({...weightData, to: e.target.value}); setTimeout(calculateWeight, 10)}}>
                                <option value="lbs">Pounds</option><option value="kg">Kilograms</option><option value="g">Grams</option><option value="oz">Ounces</option><option value="ton">Tonnes</option>
                            </select>
                          </div>
                          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/30 rounded-xl text-center mt-4">
                            <p className="text-3xl font-bold text-zinc-700 dark:text-zinc-300">{weightResult.toFixed(4)}</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">{weightData.to}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Temperature */}
                    <Dialog open={settings.activeCalculator === "temp"} onOpenChange={(open) => settings.setActiveCalculator(open ? "temp" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                          <Thermometer className="mr-2 size-3.5" /> Temp
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Temperature Converter</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label>Value</Label>
                              <Input type="number" value={tempData.value} onChange={(e) => setTempData({...tempData, value: Number(e.target.value)})} onKeyUp={calculateTemp} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>From</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={tempData.from} onChange={(e) => {setTempData({...tempData, from: e.target.value}); setTimeout(calculateTemp, 10)}}>
                                <option value="c">Celsius</option><option value="f">Fahrenheit</option><option value="k">Kelvin</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRightLeft className="size-5 text-muted-foreground" /></div>
                          <div className="space-y-2">
                            <Label>To</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={tempData.to} onChange={(e) => {setTempData({...tempData, to: e.target.value}); setTimeout(calculateTemp, 10)}}>
                                <option value="f">Fahrenheit</option><option value="c">Celsius</option><option value="k">Kelvin</option>
                            </select>
                          </div>
                          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl text-center mt-4">
                            <p className="text-3xl font-bold text-red-700 dark:text-red-300">{tempResult.toFixed(2)}</p>
                            <p className="text-sm text-red-600 dark:text-red-400 capitalize">{tempData.to}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Speed */}
                    <Dialog open={settings.activeCalculator === "speed"} onOpenChange={(open) => settings.setActiveCalculator(open ? "speed" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600">
                          <Gauge className="mr-2 size-3.5" /> Speed
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Speed Converter</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label>Value</Label>
                              <Input type="number" value={speedData.value} onChange={(e) => setSpeedData({...speedData, value: Number(e.target.value)})} onKeyUp={calculateSpeed} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>From</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={speedData.from} onChange={(e) => {setSpeedData({...speedData, from: e.target.value}); setTimeout(calculateSpeed, 10)}}>
                                <option value="kmh">km/h</option><option value="mph">mph</option><option value="ms">m/s</option><option value="knots">Knots</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRightLeft className="size-5 text-muted-foreground" /></div>
                          <div className="space-y-2">
                            <Label>To</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={speedData.to} onChange={(e) => {setSpeedData({...speedData, to: e.target.value}); setTimeout(calculateSpeed, 10)}}>
                                <option value="mph">mph</option><option value="kmh">km/h</option><option value="ms">m/s</option><option value="knots">Knots</option>
                            </select>
                          </div>
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl text-center mt-4">
                            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{speedResult.toFixed(2)}</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 capitalize">{speedData.to}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Time */}
                    <Dialog open={settings.activeCalculator === "time"} onOpenChange={(open) => settings.setActiveCalculator(open ? "time" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600">
                          <Timer className="mr-2 size-3.5" /> Time
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Time Converter</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                              <Label>Value</Label>
                              <Input type="number" value={timeData.value} onChange={(e) => setTimeData({...timeData, value: Number(e.target.value)})} onKeyUp={calculateTime} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>From</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={timeData.from} onChange={(e) => {setTimeData({...timeData, from: e.target.value}); setTimeout(calculateTime, 10)}}>
                                <option value="s">Seconds</option><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRightLeft className="size-5 text-muted-foreground" /></div>
                          <div className="space-y-2">
                            <Label>To</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={timeData.to} onChange={(e) => {setTimeData({...timeData, to: e.target.value}); setTimeout(calculateTime, 10)}}>
                                <option value="minutes">Minutes</option><option value="s">Seconds</option><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option>
                            </select>
                          </div>
                          <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-center mt-4">
                            <p className="text-3xl font-bold text-violet-700 dark:text-violet-300">{timeResult.toFixed(2)}</p>
                            <p className="text-sm text-violet-600 dark:text-violet-400 capitalize">{timeData.to}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                  </div>
                </div>

                <Separator />

                {/* Business Calculators Section */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BarChart className="size-3.5" /> Business Tools
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    
                    {/* Profit Margin */}
                    <Dialog open={settings.activeCalculator === "margin"} onOpenChange={(open) => settings.setActiveCalculator(open ? "margin" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600">
                          <BarChart className="mr-2 size-3.5" /> Profit Margin
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Profit Margin Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Total Cost (₹)</Label>
                            <Input type="number" value={marginData.cost} onChange={(e) => setMarginData({...marginData, cost: Number(e.target.value)})} onKeyUp={calculateMargin} />
                          </div>
                          <div className="space-y-2">
                            <Label>Total Revenue (₹)</Label>
                            <Input type="number" value={marginData.revenue} onChange={(e) => setMarginData({...marginData, revenue: Number(e.target.value)})} onKeyUp={calculateMargin} />
                          </div>
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Gross Profit Margin</p>
                            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{marginResult}%</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Discount */}
                    <Dialog open={settings.activeCalculator === "discount"} onOpenChange={(open) => settings.setActiveCalculator(open ? "discount" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600">
                          <Tag className="mr-2 size-3.5" /> Discount
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Discount Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Original Price (₹)</Label>
                            <Input type="number" value={discountData.price} onChange={(e) => setDiscountData({...discountData, price: Number(e.target.value)})} onKeyUp={calculateDiscount} />
                          </div>
                          <div className="space-y-2">
                            <Label>Discount (%)</Label>
                            <Input type="number" value={discountData.discountPercent} onChange={(e) => setDiscountData({...discountData, discountPercent: Number(e.target.value)})} onKeyUp={calculateDiscount} />
                          </div>
                          <div className="p-4 bg-pink-50 dark:bg-pink-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-pink-600 dark:text-pink-400 mb-1">Final Price</p>
                            <p className="text-3xl font-bold text-pink-700 dark:text-pink-300">₹{discountResult.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* GST */}
                    <Dialog open={settings.activeCalculator === "gst"} onOpenChange={(open) => settings.setActiveCalculator(open ? "gst" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600">
                          <FileText className="mr-2 size-3.5" /> GST / Sales Tax
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>GST Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <Input type="number" value={gstData.amount} onChange={(e) => setGstData({...gstData, amount: Number(e.target.value)})} onKeyUp={calculateGst} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>GST Rate (%)</Label>
                              <Input type="number" value={gstData.rate} onChange={(e) => setGstData({...gstData, rate: Number(e.target.value)})} onKeyUp={calculateGst} />
                            </div>
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                                value={gstData.type} onChange={(e) => {setGstData({...gstData, type: e.target.value}); setTimeout(calculateGst, 10)}}>
                                <option value="exclusive">Exclusive (+ GST)</option>
                                <option value="inclusive">Inclusive (Inside)</option>
                              </select>
                            </div>
                          </div>
                          <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-teal-600 dark:text-teal-400 mb-1">Total Tax: ₹{gstResult.tax.toLocaleString("en-IN")}</p>
                            <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">₹{gstResult.total.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Break-even */}
                    <Dialog open={settings.activeCalculator === "breakeven"} onOpenChange={(open) => settings.setActiveCalculator(open ? "breakeven" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600">
                          <Target className="mr-2 size-3.5" /> Break-even
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Break-even Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Total Fixed Costs (₹)</Label>
                            <Input type="number" value={breakevenData.fixedCosts} onChange={(e) => setBreakevenData({...breakevenData, fixedCosts: Number(e.target.value)})} onKeyUp={calculateBreakeven} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Price per Unit</Label>
                              <Input type="number" value={breakevenData.pricePerUnit} onChange={(e) => setBreakevenData({...breakevenData, pricePerUnit: Number(e.target.value)})} onKeyUp={calculateBreakeven} />
                            </div>
                            <div className="space-y-2">
                              <Label>Variable Cost / Unit</Label>
                              <Input type="number" value={breakevenData.varCostPerUnit} onChange={(e) => setBreakevenData({...breakevenData, varCostPerUnit: Number(e.target.value)})} onKeyUp={calculateBreakeven} />
                            </div>
                          </div>
                          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Units to Break-even</p>
                            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{breakevenResult}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                  </div>
                </div>

                <Separator />

                {/* Date & Time Calculators Section */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" /> Date & Time
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    
                    {/* Age Calculator */}
                    <Dialog open={settings.activeCalculator === "age"} onOpenChange={(open) => settings.setActiveCalculator(open ? "age" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-600">
                          <Calendar className="mr-2 size-3.5" /> Age Calc
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Age Calculator</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input type="date" value={ageData.dob} onChange={(e) => {setAgeData({...ageData, dob: e.target.value}); setTimeout(calculateAge, 10)}} />
                          </div>
                          <div className="space-y-2">
                            <Label>Age at Date</Label>
                            <Input type="date" value={ageData.target} onChange={(e) => {setAgeData({...ageData, target: e.target.value}); setTimeout(calculateAge, 10)}} />
                          </div>
                          <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-sky-600 dark:text-sky-400 mb-1">Exact Age</p>
                            <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{ageResult.years} Years, {ageResult.months} Months, {ageResult.days} Days</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Date Difference */}
                    <Dialog open={settings.activeCalculator === "datediff"} onOpenChange={(open) => settings.setActiveCalculator(open ? "datediff" : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600">
                          <CalendarDays className="mr-2 size-3.5" /> Date Diff
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Date Difference / Duration</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={dateDiffData.start} onChange={(e) => {setDateDiffData({...dateDiffData, start: e.target.value}); setTimeout(calculateDateDiff, 10)}} />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" value={dateDiffData.end} onChange={(e) => {setDateDiffData({...dateDiffData, end: e.target.value}); setTimeout(calculateDateDiff, 10)}} />
                          </div>
                          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-center mt-4">
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Total Days Between</p>
                            <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{dateDiffResult} Days</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                  </div>
                </div>

                <Separator />

                {/* Theme */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sun className="size-3.5" /> Theme
                  </Label>
                  {mounted && (
                    <div className="grid grid-cols-3 gap-2">
                      {themeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = theme === opt.value;
                        return (
                          <Button
                            key={opt.value}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className={`rounded-xl h-10 gap-1.5 text-xs ${
                              isActive
                                ? "bg-gradient-to-r from-zinc-700 to-zinc-900 text-white border-0"
                                : ""
                            }`}
                            onClick={() => setTheme(opt.value)}
                          >
                            <Icon className="size-3.5" />
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Font Size */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Type className="size-3.5" /> Font Size
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {fontSizes.map((fs) => (
                      <Button
                        key={fs.value}
                        variant={settings.fontSize === fs.value ? "default" : "outline"}
                        size="sm"
                        className={`rounded-lg h-9 text-xs px-2 ${
                          settings.fontSize === fs.value
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0"
                            : ""
                        }`}
                        onClick={() => settings.setFontSize(fs.value)}
                      >
                        {fs.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Toggles */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-amber-600" />
                    <div>
                      <Label className="text-sm font-medium">Reading Mode</Label>
                      <p className="text-xs text-muted-foreground">Warm tones, serif font</p>
                    </div>
                  </div>
                  <Switch checked={settings.readingMode} onCheckedChange={settings.setReadingMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-purple-600" />
                    <div>
                      <Label className="text-sm font-medium">High Contrast</Label>
                      <p className="text-xs text-muted-foreground">Better visibility</p>
                    </div>
                  </div>
                  <Switch checked={settings.highContrast} onCheckedChange={settings.setHighContrast} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-yellow-600" />
                    <div>
                      <Label className="text-sm font-medium">Reduce Animations</Label>
                      <p className="text-xs text-muted-foreground">Less motion</p>
                    </div>
                  </div>
                  <Switch checked={settings.reduceAnimations} onCheckedChange={settings.setReduceAnimations} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Minimize2 className="size-4 text-green-600" />
                    <div>
                      <Label className="text-sm font-medium">Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">Tighter spacing</p>
                    </div>
                  </div>
                  <Switch checked={settings.compactMode} onCheckedChange={settings.setCompactMode} />
                </div>

                <Separator />

                {/* Language */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Globe className="size-3.5" /> Language
                  </Label>
                  <Select value={i18n.language} onValueChange={(v) => i18n.changeLanguage(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.nativeLabel} ({lang.label})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl gap-2 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={handleReset}
                >
                  <RotateCcw className="size-3.5" />
                  Reset All Settings
                </Button>
              </div>
            </div>
          </motion.div>
    </>
  );
}
