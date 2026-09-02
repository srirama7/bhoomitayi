"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface HeroVideoBackgroundProps {
  isNative?: boolean;
}

export function HeroVideoBackground({ isNative = false }: HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (isNative) return;
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to image
        });
      }
    }
  }, [isNative]);

  // Native APK / Image background: Beautiful high-resolution forest landscape
  if (isNative) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
        <Image
          src="/hero-forest.png"
          alt="BhoomiTayi Nature Landscape"
          fill
          priority
          className="object-cover object-center scale-105 animate-subtle-zoom"
          sizes="100vw"
          quality={90}
        />
        {/* Subtle cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/40 to-slate-950/80 pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Background Image fallback / base */}
      <Image
        src="/hero-forest.png"
        alt="BhoomiTayi Nature Landscape"
        fill
        priority
        className="object-cover object-center scale-105"
        sizes="100vw"
        quality={90}
      />
      {/* Web: Optional video overlay if available */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/hero-forest.png"
        onLoadedData={() => setVideoLoaded(true)}
        onCanPlay={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-bottom transition-opacity duration-700 ${
          videoLoaded ? "opacity-40" : "opacity-0"
        }`}
      >
        <source src="/forest-canopy-breeze.mp4" type="video/mp4" />
        <source src="/forest-canopy-breeze.webm" type="video/webm" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/35 to-slate-950/75 pointer-events-none" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}
