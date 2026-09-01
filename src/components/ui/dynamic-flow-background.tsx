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
    // Throttle to 30fps to halve GPU usage
    let lastTime = 0;
    const FRAME_INTERVAL = 1000 / 30;

    const render = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(render);
      const elapsed = timestamp - lastTime;
      if (elapsed < FRAME_INTERVAL) return;
      lastTime = timestamp - (elapsed % FRAME_INTERVAL);

      t += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Gradient 1 — violet/indigo
      const p1x = width * (0.3 + Math.sin(t * 0.9) * 0.2);
      const p1y = height * (0.4 + Math.cos(t * 0.7) * 0.25);
      const grad1 = ctx.createRadialGradient(p1x, p1y, 10, p1x, p1y, width * 0.65);
      grad1.addColorStop(0, "rgba(124, 58, 237, 0.18)");
      grad1.addColorStop(0.5, "rgba(79, 70, 229, 0.08)");
      grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Gradient 2 — pink
      const p2x = width * (0.7 + Math.cos(t * 0.8) * 0.2);
      const p2y = height * (0.6 + Math.sin(t * 0.6) * 0.25);
      const grad2 = ctx.createRadialGradient(p2x, p2y, 10, p2x, p2y, width * 0.6);
      grad2.addColorStop(0, "rgba(236, 72, 153, 0.14)");
      grad2.addColorStop(0.5, "rgba(249, 115, 22, 0.06)");
      grad2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);
    };

    animationFrameId = requestAnimationFrame(render);

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
