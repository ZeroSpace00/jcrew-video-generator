"use client";

import { useRef, useState, useCallback } from "react";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onRemove?: (id: string) => void;
}

export default function ProductCard({ product, onRemove }: ProductCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <div className="group">
      <a
        href={product.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-[3/4] overflow-hidden bg-stone-100 cursor-pointer mb-3 block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Static product image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.primaryImageUrl}
          alt={product.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Video overlay */}
        <video
          ref={videoRef}
          src={product.videoUrl}
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* New badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-white text-[10px] font-semibold tracking-wide text-stone-900 px-2 py-1">
            New
          </span>
        </div>

        {/* Wishlist heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-stone-400 hover:text-red-500 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

        {/* Quick Shop button */}
        <div
          className={`absolute bottom-4 inset-x-0 flex justify-center transition-opacity duration-300 pointer-events-none ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="px-8 py-2.5 bg-white border border-stone-900 text-sm font-semibold tracking-widest text-stone-900 uppercase">
            Quick Shop
          </span>
        </div>
      </a>

      <div className="mt-2 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <a
            href={product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-stone-900 leading-snug line-clamp-2 hover:underline"
          >
            {product.title}
          </a>
          {onRemove && (
            <button
              onClick={() => onRemove(product.id)}
              className="text-stone-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
              title="Remove from preview"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <p className="text-sm text-stone-900">{product.price}</p>
      </div>
    </div>
  );
}
