"use client";

import { useEffect, useState, useCallback } from "react";
import type { Product } from "@/lib/types";
import {
  getSavedProducts,
  removeProduct,
  clearProducts,
  saveAllProducts,
} from "@/lib/storage";
import ProductCard from "@/components/ProductCard";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  "NEW",
  "WOMEN",
  "MEN",
  "KIDS",
  "CASHMERE",
  "LINEN",
  "SWIM",
  "PETITES",
  "BRANDS",
  "SALE",
];

const FILTER_SECTIONS = [
  "Category",
  "Size & Fit",
  "Color",
  "Pattern",
  "Personalize",
  "Neck Line",
  "Rise",
  "Sleeve Length",
  "Price",
  "Discount",
  "Occasion",
  "Trending",
];

const isPreviewOnly = process.env.NEXT_PUBLIC_PREVIEW_ONLY === "true";

export default function PreviewPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setProducts(getSavedProducts());
  }, []);

  const handleRemove = useCallback((id: string) => {
    removeProduct(id);
    setProducts(getSavedProducts());
  }, []);

  const handleClearAll = useCallback(() => {
    clearProducts();
    setProducts([]);
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      setDragOverIndex(index);
    },
    [dragIndex]
  );

  const handleDrop = useCallback(
    (index: number) => {
      if (dragIndex === null || dragIndex === index) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
      }
      setProducts((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(dragIndex, 1);
        updated.splice(index, 0, moved);
        saveAllProducts(updated);
        return updated;
      });
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation - Black bar */}
      <header className="bg-stone-900 text-white">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              router.push("/");
            }}
            className="text-2xl tracking-[0.3em] font-serif font-bold flex-shrink-0"
          >
            J.CREW
          </a>

          {/* Nav items */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium tracking-wide">
            {NAV_ITEMS.map((item) => (
              <span
                key={item}
                className={`cursor-pointer hover:opacity-80 transition-opacity ${
                  item === "SALE" ? "text-red-400" : ""
                }`}
              >
                {item}
              </span>
            ))}
          </nav>

          {/* Right side: search + icons */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-white/10 rounded px-3 py-1.5 text-xs text-white/70 gap-2">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Search J.Crew</span>
            </div>
            {/* Account icon */}
            <svg
              className="w-5 h-5 cursor-pointer hover:opacity-80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            {/* Cart icon */}
            <svg
              className="w-5 h-5 cursor-pointer hover:opacity-80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3 text-xs text-stone-500">
          <span className="hover:underline cursor-pointer">Home</span>
          <span className="mx-1.5">/</span>
          <span className="hover:underline cursor-pointer">Shop All</span>
          <span className="mx-1.5">/</span>
          <span className="text-stone-900">Men</span>
        </div>
      </div>

      {/* Page Title */}
      <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-stone-900 uppercase">
          Shop All Men&apos;s Clothing
        </h1>
      </div>

      {/* Filter/Sort Toolbar */}
      <div className="border-y border-stone-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            {/* Hide Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 font-medium text-stone-900"
            >
              {showFilters ? "Hide" : "Show"} Filters
              <svg
                className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 border border-stone-300 rounded px-3 py-1.5">
              <span className="text-stone-700">Featured</span>
              <svg
                className="w-3 h-3 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4 text-stone-500 text-xs">
            {!isPreviewOnly && (
              <>
                <button
                  onClick={() => router.push("/")}
                  className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
                >
                  + Add Product
                </button>
                {products.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-stone-400 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <span className="text-stone-300">|</span>
              </>
            )}
            <span>
              {products.length} item{products.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar + Grid */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-serif mb-2 text-stone-900">
              No products yet
            </h2>
            <p className="text-stone-500 mb-6">
              Generate a video for a J.Crew product to see it here.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-8 py-3 bg-stone-900 text-white hover:bg-stone-800 transition-colors font-medium text-sm tracking-wide uppercase"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Left Sidebar Filters */}
            {showFilters && (
              <aside className="w-56 flex-shrink-0 hidden md:block">
                <div className="divide-y divide-stone-200">
                  {FILTER_SECTIONS.map((section) => (
                    <button
                      key={section}
                      className="w-full flex items-center justify-between py-4 text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
                    >
                      <span>{section}</span>
                      <svg
                        className="w-3.5 h-3.5 text-stone-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </aside>
            )}

            {/* Product Grid */}
            <div className="flex-1 min-w-0">
              <div
                className={`grid gap-x-5 gap-y-10 ${
                  showFilters
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                }`}
              >
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    draggable={!isPreviewOnly}
                    onDragStart={!isPreviewOnly ? () => handleDragStart(index) : undefined}
                    onDragOver={!isPreviewOnly ? (e) => handleDragOver(e, index) : undefined}
                    onDrop={!isPreviewOnly ? () => handleDrop(index) : undefined}
                    onDragEnd={!isPreviewOnly ? handleDragEnd : undefined}
                    className={`transition-all duration-200 ${
                      dragIndex === index
                        ? "opacity-40 scale-95"
                        : dragOverIndex === index
                          ? "ring-2 ring-stone-400 ring-offset-2 rounded-lg"
                          : ""
                    }`}
                  >
                    <ProductCard
                      product={product}
                      onRemove={!isPreviewOnly ? handleRemove : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
