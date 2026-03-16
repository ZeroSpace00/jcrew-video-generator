"use client";

import { useEffect, useState, useCallback } from "react";
import type { Product } from "@/lib/types";
import { getSavedProducts, removeProduct, clearProducts } from "@/lib/storage";
import ProductCard from "@/components/ProductCard";
import { useRouter } from "next/navigation";

export default function PreviewPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Storefront Header */}
      <header className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-2 text-xs text-stone-500 border-b border-stone-100">
            <span>Free shipping on orders over $150</span>
            <div className="flex gap-4">
              <span>My Account</span>
              <span>Stores</span>
            </div>
          </div>
          {/* Main nav */}
          <div className="py-4 flex items-center justify-between">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-700">
              <span className="hover:text-stone-900 cursor-pointer">
                Women
              </span>
              <span className="hover:text-stone-900 cursor-pointer">Men</span>
              <span className="hover:text-stone-900 cursor-pointer">
                Kids
              </span>
              <span className="hover:text-stone-900 cursor-pointer">
                Sale
              </span>
            </nav>

            <h1 className="text-3xl tracking-widest font-serif font-bold absolute left-1/2 -translate-x-1/2">
              J.CREW
            </h1>

            <div className="flex items-center gap-4 text-sm text-stone-600">
              <button
                onClick={() => router.push("/")}
                className="hover:text-stone-900 transition-colors"
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
            </div>
          </div>
        </div>
      </header>

      {/* Category bar */}
      <div className="border-b border-stone-100 bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6 text-sm text-stone-500">
          <span className="text-stone-900 font-medium">New Arrivals</span>
          <span className="hover:text-stone-900 cursor-pointer">
            Bestsellers
          </span>
          <span className="hover:text-stone-900 cursor-pointer">
            Cashmere
          </span>
          <span className="hover:text-stone-900 cursor-pointer">Denim</span>
          <span className="hover:text-stone-900 cursor-pointer">Suiting</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
              className="px-8 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-stone-500">
                {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                &mdash; hover to preview video
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
