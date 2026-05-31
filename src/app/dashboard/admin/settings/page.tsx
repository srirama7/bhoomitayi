"use client";

import { Shield, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="size-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
        <Lock className="size-8" />
      </div>
      <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Section Under Construction</h2>
      <p className="text-zinc-500 max-w-sm">This module is currently being optimized for the new Admin Console. Please check back soon.</p>
    </div>
  );
}
