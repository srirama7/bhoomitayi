"use client";

import { useEffect, useRef, useState } from "react";

interface HeroVideoBackgroundProps {
  isNative?: boolean;
}

export function HeroVideoBackground({ isNative = false }: HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* 1. Master Clean Video Element: Full natural clarity, brightness and vibrant lush green trees in all modes */}
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

      {/* 2. Light Mode: Rich atmospheric sky gradient providing strong contrast for white/gradient hero text */}
      <div className="absolute top-0 inset-x-0 h-[75%] bg-gradient-to-b from-slate-950/85 via-slate-900/60 to-transparent dark:opacity-0 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/20 dark:opacity-0 transition-opacity duration-500 pointer-events-none" />

      {/* 3. Dark Mode: Deep midnight night sky gradient over the sky area for pristine legibility */}
      <div className="absolute top-0 inset-x-0 h-[75%] opacity-0 dark:opacity-100 transition-opacity duration-500 mix-blend-multiply bg-gradient-to-b from-[#020617] via-[#0b1329]/90 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[70%] opacity-0 dark:opacity-100 transition-opacity duration-500 mix-blend-overlay bg-gradient-to-b from-blue-900/90 via-indigo-900/60 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[65%] opacity-0 dark:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-[#020612]/80 via-[#040e26]/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-0 dark:opacity-100 bg-black/25 pointer-events-none" />

      {/* Bottom section leaves the lush green canopy trees 100% natural, crisp, and vibrant */}
    </div>
  );
}
