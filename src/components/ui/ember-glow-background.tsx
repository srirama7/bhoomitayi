"use client";

import React, { useEffect, useRef } from "react";

interface EmberGlowBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
  colorScheme?: "amber" | "violet" | "emerald" | "multi";
}

export function EmberGlowBackground({
  className = "",
  intensity = "medium",
  colorScheme = "amber",
}: EmberGlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Reduced from 55 → 20 particles to cut GPU/RAM usage
    const particleCount = intensity === "low" ? 12 : intensity === "high" ? 28 : 20;

    const getBaseHue = () => {
      switch (colorScheme) {
        case "violet": return 270;
        case "emerald": return 160;
        case "multi": return Math.random() * 360;
        case "amber":
        default: return 35 + Math.random() * 25;
      }
    };

    interface Particle {
      x: number; y: number; size: number;
      speedX: number; speedY: number;
      opacity: number; pulseSpeed: number;
      hue: number; sparkle: number;
    }

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: -Math.random() * 0.9 - 0.3,
      opacity: Math.random() * 0.7 + 0.3,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      hue: getBaseHue(),
      sparkle: Math.random() * Math.PI * 2,
    }));

    let glowTick = 0;
    // Throttle to 30fps — halves GPU workload vs 60fps
    let lastTime = 0;
    const FRAME_INTERVAL = 1000 / 30;

    const render = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(render);
      const elapsed = timestamp - lastTime;
      if (elapsed < FRAME_INTERVAL) return;
      lastTime = timestamp - (elapsed % FRAME_INTERVAL);

      glowTick += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Single ambient gradient background glow
      const primaryGradient = ctx.createRadialGradient(
        width * (0.3 + Math.sin(glowTick * 0.7) * 0.15),
        height * (0.6 + Math.cos(glowTick * 0.5) * 0.15),
        10, width * 0.5, height * 0.5,
        Math.max(width, height) * 0.7
      );
      if (colorScheme === "amber") {
        primaryGradient.addColorStop(0, "rgba(245, 158, 11, 0.20)");
        primaryGradient.addColorStop(0.5, "rgba(217, 119, 6, 0.10)");
        primaryGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (colorScheme === "violet") {
        primaryGradient.addColorStop(0, "rgba(168, 85, 247, 0.20)");
        primaryGradient.addColorStop(0.5, "rgba(126, 34, 206, 0.08)");
        primaryGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        primaryGradient.addColorStop(0, "rgba(59, 130, 246, 0.18)");
        primaryGradient.addColorStop(0.5, "rgba(16, 185, 129, 0.08)");
        primaryGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = primaryGradient;
      ctx.fillRect(0, 0, width, height);

      // Particles rendered as simple circles (no per-particle RadialGradient)
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(glowTick * 2 + p.y * 0.02) * 0.4;
        p.sparkle += p.pulseSpeed;

        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = Math.max(0.1, p.opacity * (0.6 + 0.4 * Math.sin(p.sparkle)));
        const currentSize = p.size * (0.8 + 0.3 * Math.sin(p.sparkle));

        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${currentOpacity * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, colorScheme]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
