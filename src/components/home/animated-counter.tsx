"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  target: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}

export function AnimatedCounter({ target, label, icon, delay = 0 }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  const numericPart = parseInt(target.replace(/[^0-9]/g, ""), 10);
  const suffix = target.replace(/[0-9,]/g, "");

  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = numericPart / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= numericPart) {
          setCount(numericPart);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [isInView, numericPart, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: delay / 1000, ease: "easeOut" }}
      className="text-center space-y-3"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/10 mb-2 backdrop-blur-sm border border-white/10 shadow-lg shadow-white/5"
      >
        {icon}
      </motion.div>
      <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight animate-counter-glow">
        {isInView ? count.toLocaleString("en-IN") : "0"}{suffix}
      </div>
      <div className="text-blue-200/70 text-lg font-medium">{label}</div>
    </motion.div>
  );
}
