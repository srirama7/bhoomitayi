"use client";

import { motion } from "framer-motion";

const particles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 1.5,
  duration: Math.random() * 12 + 10,
  delay: Math.random() * 5,
}));

const floatingShapes = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  x: Math.random() * 80 + 10,
  y: Math.random() * 80 + 10,
  size: Math.random() * 60 + 30,
  duration: Math.random() * 8 + 12,
  delay: Math.random() * 4,
  rotation: Math.random() * 360,
}));

export function HeroParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
      {floatingShapes.map((shape) => (
        <motion.div
          key={`shape-${shape.id}`}
          className="absolute rounded-2xl border border-white/[0.07]"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            rotate: shape.rotation,
          }}
          animate={{
            y: [0, -40, -20, -60, 0],
            x: [0, 20, -10, 15, 0],
            rotate: [shape.rotation, shape.rotation + 90, shape.rotation + 180, shape.rotation + 270, shape.rotation + 360],
            opacity: [0.05, 0.12, 0.07, 0.1, 0.05],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)`,
            boxShadow: `0 0 ${p.size * 2}px ${p.size}px rgba(255,255,255,0.1)`,
          }}
          animate={{
            y: [0, -80, -40, -100, 0],
            x: [0, 30, -20, 10, 0],
            opacity: [0.15, 0.5, 0.25, 0.6, 0.15],
            scale: [1, 1.3, 0.8, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Connecting lines effect */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <motion.line
          x1="10%" y1="20%" x2="40%" y2="60%"
          stroke="white" strokeWidth="1"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 0 }}
        />
        <motion.line
          x1="60%" y1="10%" x2="90%" y2="50%"
          stroke="white" strokeWidth="1"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
        <motion.line
          x1="30%" y1="70%" x2="70%" y2="30%"
          stroke="white" strokeWidth="1"
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        />
      </svg>
    </div>
  );
}
