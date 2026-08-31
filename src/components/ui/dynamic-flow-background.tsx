"use client";

import React, { useEffect, useRef } from "react";

interface DynamicFlowBackgroundProps {
  className?: string;
}

export function DynamicFlowBackground({ className = "" }: DynamicFlowBackgroundProps) {
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

    let t = 0;

    const render = () => {
      t += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Create sweeping flowing multi-point radial aurora
      const p1x = width * (0.3 + Math.sin(t * 0.9) * 0.2);
      const p1y = height * (0.4 + Math.cos(t * 0.7) * 0.25);
      const grad1 = ctx.createRadialGradient(p1x, p1y, 10, p1x, p1y, width * 0.65);
      grad1.addColorStop(0, "rgba(124, 58, 237, 0.22)"); // Violet
      grad1.addColorStop(0.5, "rgba(79, 70, 229, 0.12)"); // Indigo
      grad1.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const p2x = width * (0.7 + Math.cos(t * 0.8) * 0.2);
      const p2y = height * (0.6 + Math.sin(t * 0.6) * 0.25);
      const grad2 = ctx.createRadialGradient(p2x, p2y, 10, p2x, p2y, width * 0.6);
      grad2.addColorStop(0, "rgba(236, 72, 153, 0.18)"); // Pink
      grad2.addColorStop(0.5, "rgba(249, 115, 22, 0.08)"); // Amber
      grad2.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      const p3x = width * (0.5 + Math.sin(t * 0.5) * 0.25);
      const p3y = height * (0.2 + Math.cos(t * 1.1) * 0.15);
      const grad3 = ctx.createRadialGradient(p3x, p3y, 10, p3x, p3y, width * 0.5);
      grad3.addColorStop(0, "rgba(6, 182, 212, 0.16)"); // Cyan
      grad3.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
