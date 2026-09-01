"use client";

import { useEffect, useState } from "react";

// Reduced from 30 particles + 6 shapes to 12 particles + 4 shapes
// Using CSS animations instead of Framer Motion to avoid JS-driven animation overhead
const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: (i * 8.3 + 5) % 100,
  y: (i * 13.7 + 10) % 100,
  size: (i % 3) + 1.5,
  duration: 12 + (i % 6) * 2,
  delay: (i % 5) * 1.2,
}));

const floatingShapes = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  x: [15, 65, 35, 80][i],
  y: [20, 15, 70, 55][i],
  size: 40 + i * 15,
  duration: 14 + i * 2,
  delay: i * 1.5,
  rotation: i * 45,
}));

export function HeroParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes — CSS animated */}
      {floatingShapes.map((shape) => (
        <div
          key={`shape-${shape.id}`}
          className="absolute rounded-2xl border border-white/[0.07] animate-float"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            transform: `rotate(${shape.rotation}deg)`,
            animationDuration: `${shape.duration}s`,
            animationDelay: `${shape.delay}s`,
            opacity: 0.07,
          }}
        />
      ))}

      {/* Glowing particles — CSS animated */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float-delayed"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(255,255,255,0.5)`,
            boxShadow: `0 0 ${p.size * 2}px ${p.size}px rgba(255,255,255,0.08)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0.3,
          }}
        />
      ))}
    </div>
  );
}
