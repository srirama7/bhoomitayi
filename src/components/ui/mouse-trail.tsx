"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function MouseTrail() {
  const [isMounted, setIsMounted] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth out the motion values using springs with different stiffness to create a trailing effect
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  
  // Create an array of trailing points
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const points = Array.from({ length: 6 }).map((_, i) => ({
    x: useSpring(mouseX, { ...springConfig, stiffness: 300 - i * 40, damping: 20 + i * 2 }),
    y: useSpring(mouseY, { ...springConfig, stiffness: 300 - i * 40, damping: 20 + i * 2 }),
    scale: 1 - i * 0.15,
    opacity: 1 - i * 0.15,
    color: i % 3 === 0 ? "bg-blue-400" : i % 3 === 1 ? "bg-purple-400" : "bg-pink-400"
  }));

  useEffect(() => {
    setIsMounted(true);
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX - 10); // Offset by half the size of the largest circle
      mouseY.set(e.clientY - 10);
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, [mouseX, mouseY]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden mix-blend-screen">
      {points.map((point, index) => (
        <motion.div
          key={index}
          className={`absolute size-5 rounded-full ${point.color} blur-[2px] shadow-[0_0_15px_rgba(255,255,255,0.8)]`}
          style={{
            x: point.x,
            y: point.y,
            scale: point.scale,
            opacity: point.opacity,
          }}
        />
      ))}
    </div>
  );
}
