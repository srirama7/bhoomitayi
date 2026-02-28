"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, TRANSACTION_TYPES } from "@/lib/constants";

type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function SearchBar() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryValue>("house");
  const [transactionType, setTransactionType] = useState<string>("buy");

  const availableTransactions = TRANSACTION_TYPES[category];

  function handleCategoryChange(value: string) {
    const newCategory = value as CategoryValue;
    setCategory(newCategory);

    const newTransactions = TRANSACTION_TYPES[newCategory];
    if (!newTransactions.includes(transactionType as never)) {
      setTransactionType(newTransactions[0]);
    }
  }

  function handleSearch() {
    const categoryData = CATEGORIES.find((c) => c.value === category);
    if (!categoryData) return;

    const params = new URLSearchParams();
    params.set("txn", transactionType);

    const queryString = params.toString();
    const url = `${categoryData.href}${queryString ? `?${queryString}` : ""}`;
    router.push(url);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl p-3 border border-white/20 dark:border-white/10 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Select */}
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-12 w-full sm:w-[180px] border-0 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="rounded-lg">
                  <span className="mr-1.5">{cat.emoji}</span>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Transaction Type Select */}
          <Select value={transactionType} onValueChange={setTransactionType}>
            <SelectTrigger className="h-12 w-full sm:w-[160px] border-0 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {availableTransactions.map((type) => (
                <SelectItem key={type} value={type} className="rounded-lg">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 sm:flex-none">
            <Button
              onClick={handleSearch}
              size="lg"
              className="h-12 w-full sm:w-auto px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/40"
            >
              <Search className="size-5" />
              <span>Search</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
