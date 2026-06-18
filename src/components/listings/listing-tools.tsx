"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Compass, Volume2, Maximize, ArrowRightLeft, Percent, FileText, Share2, StopCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ListingTools({ 
  listingPrice, 
  description, 
  area, 
  category 
}: { 
  listingPrice: number, 
  description: string, 
  area?: number, 
  category: string 
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emiData, setEmiData] = useState({ down: 20, interest: 8.5, years: 20 });
  const [emiResult, setEmiResult] = useState(0);

  const [unitData, setUnitData] = useState({ value: area || 1000, from: "sqft", to: "acres" });
  const [unitResult, setUnitResult] = useState(0);

  const [yieldData, setYieldData] = useState({ price: listingPrice, rent: listingPrice * 0.005 });
  const [yieldResult, setYieldResult] = useState(0);

  // Read Aloud
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handleReadAloud = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text to speech is not supported in your browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(description);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // EMI Calculator
  const calculateEmi = () => {
    const principal = listingPrice - (listingPrice * (emiData.down / 100));
    const r = (emiData.interest / 12) / 100;
    const n = emiData.years * 12;
    if (r === 0) {
      setEmiResult(principal / n);
      return;
    }
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    setEmiResult(Math.round(emi));
  };

  // Unit Converter
  const convertUnits = () => {
    const sqftValues: Record<string, number> = {
      sqft: 1,
      acres: 43560,
      hectares: 107639,
      guntas: 1089,
      cents: 435.6
    };
    const inSqft = unitData.value * sqftValues[unitData.from];
    const outVal = inSqft / sqftValues[unitData.to];
    setUnitResult(outVal);
  };

  // Yield Calculator
  const calculateYield = () => {
    const annualRent = yieldData.rent * 12;
    const roi = (annualRent / yieldData.price) * 100;
    setYieldResult(Number(roi.toFixed(2)));
  };

  // Compass
  const [heading, setHeading] = useState<number | null>(null);
  const handleCompass = () => {
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientationabsolute", (event: any) => {
        if (event.webkitCompassHeading) {
          setHeading(event.webkitCompassHeading); // iOS
        } else if (event.alpha) {
          setHeading(360 - event.alpha); // Android
        }
      }, true);
      toast.success("Compass activated! Point your phone.");
    } else {
      toast.error("Compass not supported on this device.");
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-3d mt-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
        <FileText className="size-5" /> Smart Tools
      </h2>
      <div className="flex flex-wrap gap-3">
        
        {/* Read Aloud */}
        <Button variant={isSpeaking ? "default" : "outline"} onClick={handleReadAloud} className="gap-2 rounded-xl">
          {isSpeaking ? <StopCircle className="size-4" /> : <Volume2 className="size-4" />}
          {isSpeaking ? "Stop Reading" : "Read Aloud"}
        </Button>

        {/* EMI Calculator */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={calculateEmi}>
              <Calculator className="size-4" /> EMI Calculator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mortgage / EMI Calculator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Down Payment (%)</Label>
                  <Input type="number" value={emiData.down} onChange={(e) => setEmiData({...emiData, down: Number(e.target.value)})} onKeyUp={calculateEmi} />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" value={emiData.interest} onChange={(e) => setEmiData({...emiData, interest: Number(e.target.value)})} onKeyUp={calculateEmi} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Loan Tenure (Years)</Label>
                  <Input type="number" value={emiData.years} onChange={(e) => setEmiData({...emiData, years: Number(e.target.value)})} onKeyUp={calculateEmi} />
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center mt-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Estimated Monthly EMI</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">₹{emiResult.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unit Converter */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={convertUnits}>
              <Maximize className="size-4" /> Area Converter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Land Area Converter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Value</Label>
                  <Input type="number" value={unitData.value} onChange={(e) => setUnitData({...unitData, value: Number(e.target.value)})} onKeyUp={convertUnits} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>From</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                    value={unitData.from} onChange={(e) => {setUnitData({...unitData, from: e.target.value}); setTimeout(convertUnits, 10)}}>
                    <option value="sqft">Sq Ft</option>
                    <option value="acres">Acres</option>
                    <option value="guntas">Guntas</option>
                    <option value="cents">Cents</option>
                    <option value="hectares">Hectares</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRightLeft className="size-5 text-muted-foreground rotate-90 sm:rotate-0" />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                    value={unitData.to} onChange={(e) => {setUnitData({...unitData, to: e.target.value}); setTimeout(convertUnits, 10)}}>
                    <option value="acres">Acres</option>
                    <option value="sqft">Sq Ft</option>
                    <option value="guntas">Guntas</option>
                    <option value="cents">Cents</option>
                    <option value="hectares">Hectares</option>
                </select>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center mt-4">
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{unitResult.toFixed(4)}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 capitalize">{unitData.to}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ROI Calculator */}
        {["house", "commercial", "pg"].includes(category) && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={calculateYield}>
                <Percent className="size-4" /> Rental Yield
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Investment ROI Calculator</DialogTitle>
              </DialogHeader>
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
        )}

        {/* Compass */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={handleCompass}>
              <Compass className="size-4" /> Vastu Compass
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vastu Compass</DialogTitle>
            </DialogHeader>
            <div className="py-8 flex flex-col items-center justify-center">
              {heading !== null ? (
                <>
                  <div className="relative w-48 h-48 rounded-full border-4 border-zinc-200 flex items-center justify-center shadow-inner">
                    <div 
                      className="absolute w-2 h-40 bg-gradient-to-t from-zinc-300 to-red-500 rounded-full transition-transform duration-200"
                      style={{ transform: `rotate(${heading}deg)` }}
                    />
                    <div className="w-6 h-6 bg-white border-2 border-red-500 rounded-full z-10" />
                  </div>
                  <p className="mt-6 text-2xl font-bold">{Math.round(heading)}°</p>
                  <p className="text-muted-foreground uppercase text-sm font-semibold tracking-widest mt-1">
                    {heading > 315 || heading <= 45 ? "North" : heading > 45 && heading <= 135 ? "East" : heading > 135 && heading <= 225 ? "South" : "West"}
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <Compass className="size-16 mx-auto text-muted-foreground animate-pulse mb-4" />
                  <p className="text-muted-foreground">Waiting for device orientation permissions...</p>
                  <p className="text-xs text-muted-foreground mt-2">(Requires a mobile device with a magnetometer)</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
