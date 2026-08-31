"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function SmartImage({ src, alt, fill, className, sizes, priority, onError }: {
  src: string; alt: string; fill?: boolean; className?: string; sizes?: string; priority?: boolean; onError?: () => void;
}) {
  if (src.startsWith("data:")) {
    return <img src={src} alt={alt} className={`${fill ? "absolute inset-0 w-full h-full" : ""} ${className || ""}`} onError={onError} />;
  }
  return <Image src={src} alt={alt} fill={fill} className={className} sizes={sizes} priority={priority} onError={onError} />;
}

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const validImages = images?.filter((img) => img && typeof img === "string") ?? [];

  const goTo = useCallback(
    (index: number) => {
      if (validImages.length === 0) return;
      setCurrentIndex(((index % validImages.length) + validImages.length) % validImages.length);
    },
    [validImages.length]
  );

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goTo(currentIndex - 1);
      if (e.key === "ArrowRight") goTo(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, currentIndex, goTo]);

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  const ImagePlaceholder = () => (
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
      <ImageOff className="size-12 text-muted-foreground/30" />
    </div>
  );

  if (validImages.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-3d">
        <div className="relative aspect-[16/9] w-full">
          <ImagePlaceholder />
        </div>
      </div>
    );
  }

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && validImages.length > 1) {
      goTo(currentIndex + 1);
    }
    if (isRightSwipe && validImages.length > 1) {
      goTo(currentIndex - 1);
    }
  };

  return (
    <>
      {/* ── MOBILE SWIPEABLE TOUCH SLIDER (Phone Screens) ── */}
      <div
        className="relative block md:hidden aspect-[4/3] rounded-2xl overflow-hidden shadow-3d group select-none bg-zinc-900"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {failedImages.has(currentIndex) ? (
          <ImagePlaceholder />
        ) : (
          <SmartImage
            src={validImages[currentIndex] || validImages[0]}
            alt={`${title} - Photo ${currentIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-300 cursor-pointer"
            sizes="100vw"
            priority
            onError={() => handleImageError(currentIndex)}
          />
        )}

        {/* Tap area to open fullscreen */}
        <div
          className="absolute inset-0 z-10"
          onClick={() => setLightboxOpen(true)}
        />

        {/* Prev/Next Slider Arrow Buttons */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md active:scale-95 transition-all shadow-md"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md active:scale-95 transition-all shadow-md"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Slide Counter Badge */}
        {validImages.length > 1 && (
          <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white shadow-sm">
            {currentIndex + 1} / {validImages.length}
          </div>
        )}

        {/* Dot Pagination Indicators */}
        {validImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md">
            {validImages.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={(e) => { e.stopPropagation(); goTo(idx); }}
                className={`size-2 rounded-full transition-all ${
                  idx === currentIndex ? "w-4 bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP GRID (Tablets & Desktops) ── */}
      <div className="hidden md:grid md:grid-cols-2 gap-2 rounded-2xl overflow-hidden shadow-3d">
        {/* Primary Image */}
        <div
          className="relative aspect-[4/3] cursor-pointer md:row-span-2 group"
          onClick={() => { setCurrentIndex(0); setLightboxOpen(true); }}
        >
          {failedImages.has(0) ? (
            <ImagePlaceholder />
          ) : (
            <SmartImage
              src={validImages[0]}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              onError={() => handleImageError(0)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        {/* Secondary Images */}
        {validImages.slice(1, 5).map((img, i) => (
          <div
            key={`gallery-${i}`}
            className="relative aspect-[4/3] cursor-pointer group"
            onClick={() => { setCurrentIndex(i + 1); setLightboxOpen(true); }}
          >
            {failedImages.has(i + 1) ? (
              <ImagePlaceholder />
            ) : (
              <SmartImage
                src={img}
                alt={`${title} ${i + 2}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="25vw"
                onError={() => handleImageError(i + 1)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {i === 3 && validImages.length > 5 && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-lg font-semibold">
                +{validImages.length - 5} more
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {validImages.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 text-white hover:bg-white/10 rounded-full size-12 z-10"
              onClick={() => goTo(currentIndex - 1)}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          <div className="relative w-full max-w-4xl aspect-[4/3] mx-16">
            {failedImages.has(currentIndex) ? (
              <ImagePlaceholder />
            ) : (
              <SmartImage
                src={validImages[currentIndex]}
                alt={`${title} ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                onError={() => handleImageError(currentIndex)}
              />
            )}
          </div>

          {validImages.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 text-white hover:bg-white/10 rounded-full size-12 z-10"
              onClick={() => goTo(currentIndex + 1)}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          <div className="absolute bottom-6 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-sm font-medium">
            {currentIndex + 1} / {validImages.length}
          </div>
        </div>
      )}
    </>
  );
}
