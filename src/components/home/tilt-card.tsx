"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltCard({ children, className = "" }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mouseX, setMouseX] = useState(50);
  const [mouseY, setMouseY] = useState(50);
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;

    setRotateX(-y / 12);
    setRotateY(x / 12);
    setMouseX(((e.clientX - rect.left) / rect.width) * 100);
    setMouseY(((e.clientY - rect.top) / rect.height) * 100);
  }

  function handleMouseLeave() {
    setRotateX(0);
    setRotateY(0);
    setIsHovering(false);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1200,
        transformStyle: "preserve-3d",
      }}
      animate={{
        rotateX,
        rotateY,
        scale: isHovering ? 1.03 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className={className}
    >
      {children}
      {/* Dynamic spotlight / glare effect */}
      {isHovering && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle at ${mouseX}% ${mouseY}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
          }}
        />
      )}
      {/* 3D shadow beneath */}
      {isHovering && (
        <motion.div
          className="absolute inset-x-4 -bottom-2 h-8 rounded-full pointer-events-none -z-10 blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
          }}
        />
      )}
    </motion.div>
  );
}
