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
      <div
        className="relative aspect-[3/4] overflow-hidden bg-stone-100 cursor-pointer mb-3"
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

        {/* Quick Shop button */}
        <div
          className={`absolute bottom-4 inset-x-0 flex justify-center transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(product.sourceUrl, "_blank");
            }}
            className="px-8 py-2.5 bg-white border border-stone-900 text-sm font-semibold tracking-widest text-stone-900 uppercase hover:bg-stone-900 hover:text-white transition-colors"
          >
            Quick Shop
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-stone-900 leading-tight line-clamp-2">
          {product.title}
        </h3>
        <p className="text-sm text-stone-600">{product.price}</p>
      </div>

      <div className="mt-3 flex gap-2">
        <button className="flex-1 py-2.5 text-sm font-medium border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors">
          Add to Bag
        </button>
        {onRemove && (
          <button
            onClick={() => onRemove(product.id)}
            className="px-3 py-2.5 text-sm text-stone-400 hover:text-red-600 transition-colors"
            title="Remove from preview"
          >
            <svg
              className="w-4 h-4"
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
    </div>
  );
}
