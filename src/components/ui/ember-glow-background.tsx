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

    const particleCount = intensity === "low" ? 35 : intensity === "high" ? 85 : 55;

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulseSpeed: number;
      hue: number;
      sparkle: number;
    }

    const getBaseHue = () => {
      switch (colorScheme) {
        case "violet":
          return 270;
        case "emerald":
          return 160;
        case "multi":
          return Math.random() * 360;
        case "amber":
        default:
          return 35 + Math.random() * 25;
      }
    };

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

    const render = () => {
      glowTick += 0.015;
      ctx.clearRect(0, 0, width, height);

      const primaryGradient = ctx.createRadialGradient(
        width * (0.3 + Math.sin(glowTick * 0.7) * 0.15),
        height * (0.6 + Math.cos(glowTick * 0.5) * 0.15),
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7
      );

      if (colorScheme === "amber") {
        primaryGradient.addColorStop(0, "rgba(245, 158, 11, 0.28)");
        primaryGradient.addColorStop(0.35, "rgba(217, 119, 6, 0.16)");
        primaryGradient.addColorStop(0.7, "rgba(180, 83, 9, 0.05)");
        primaryGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (colorScheme === "violet") {
        primaryGradient.addColorStop(0, "rgba(168, 85, 247, 0.28)");
        primaryGradient.addColorStop(0.4, "rgba(126, 34, 206, 0.15)");
        primaryGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        primaryGradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
        primaryGradient.addColorStop(0.4, "rgba(16, 185, 129, 0.15)");
        primaryGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      }

      ctx.fillStyle = primaryGradient;
      ctx.fillRect(0, 0, width, height);

      const secondaryGradient = ctx.createRadialGradient(
        width * (0.75 + Math.cos(glowTick * 0.8) * 0.12),
        height * (0.35 + Math.sin(glowTick * 0.6) * 0.12),
        5,
        width * 0.7,
        height * 0.4,
        Math.max(width, height) * 0.5
      );
      secondaryGradient.addColorStop(0, "rgba(251, 191, 36, 0.22)");
      secondaryGradient.addColorStop(0.5, "rgba(234, 88, 12, 0.08)");
      secondaryGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = secondaryGradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(glowTick * 2 + p.y * 0.02) * 0.4;
        p.sparkle += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = Math.max(0.1, p.opacity * (0.6 + 0.4 * Math.sin(p.sparkle)));
        const currentSize = p.size * (0.8 + 0.3 * Math.sin(p.sparkle));

        const glowRad = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          currentSize * 5
        );
        glowRad.addColorStop(0, `hsla(${p.hue}, 100%, 75%, ${currentOpacity})`);
        glowRad.addColorStop(0.4, `hsla(${p.hue}, 95%, 55%, ${currentOpacity * 0.5})`);
        glowRad.addColorStop(1, `hsla(${p.hue}, 90%, 40%, 0)`);

        ctx.fillStyle = glowRad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.95})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentSize * 0.6), 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, colorScheme]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(0,0,0,0.4)_100%)] mix-blend-multiply" />
    </div>
  );
}
