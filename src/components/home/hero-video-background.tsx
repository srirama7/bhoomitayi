"use client";

import { useEffect, useRef, useState } from "react";

interface HeroVideoBackgroundProps {
  isNative?: boolean;
}

export function HeroVideoBackground({ isNative = false }: HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (isNative) return; // Skip video in native APK to save ~19MB
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay fallback
        });
      }
    }
  }, [isNative]);

  // Native APK: use lightweight animated CSS gradient (saves ~19MB, no lag)
  if (isNative) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
        {/* Animated gradient sky for native — zero bundle cost */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 30%, #2d6a4f 65%, #1b4332 100%)",
            animation: "nativeBgShift 12s ease-in-out infinite alternate",
          }}
        />
        <style>{`
          @keyframes nativeBgShift {
            0%   { filter: brightness(0.92) saturate(1.1); }
            50%  { filter: brightness(1.05) saturate(1.25); }
            100% { filter: brightness(0.97) saturate(1.15); }
          }
        `}</style>
        {/* Gradient overlays identical to web version */}
        <div className="absolute top-0 inset-x-0 h-[75%] bg-gradient-to-b from-slate-950/80 via-slate-900/55 to-transparent dark:opacity-0 pointer-events-none" />
        <div className="absolute inset-0 bg-slate-950/15 dark:opacity-0 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-[75%] opacity-0 dark:opacity-100 mix-blend-multiply bg-gradient-to-b from-[#020617] via-[#0b1329]/90 to-transparent pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-[70%] opacity-0 dark:opacity-100 mix-blend-overlay bg-gradient-to-b from-blue-900/90 via-indigo-900/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-0 dark:opacity-100 bg-black/25 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Web: Full video background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/forest-canopy-poster.jpg"
        onLoadedData={() => setVideoLoaded(true)}
        onCanPlay={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-bottom transition-opacity duration-700 ${
          videoLoaded ? "opacity-100" : "opacity-95"
        }`}
      >
        <source src="/forest-canopy-breeze.mp4" type="video/mp4" />
        <source src="/forest-canopy-breeze.webm" type="video/webm" />
      </video>

      <div className="absolute top-0 inset-x-0 h-[75%] bg-gradient-to-b from-slate-950/85 via-slate-900/60 to-transparent dark:opacity-0 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/20 dark:opacity-0 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[75%] opacity-0 dark:opacity-100 transition-opacity duration-500 mix-blend-multiply bg-gradient-to-b from-[#020617] via-[#0b1329]/90 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[70%] opacity-0 dark:opacity-100 transition-opacity duration-500 mix-blend-overlay bg-gradient-to-b from-blue-900/90 via-indigo-900/60 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[65%] opacity-0 dark:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-[#020612]/80 via-[#040e26]/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-0 dark:opacity-100 bg-black/25 pointer-events-none" />
    </div>
  );
}

