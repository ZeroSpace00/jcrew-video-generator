"use client";

import { useState, useCallback } from "react";

interface ProductResult {
  productUrl: string;
  title: string | null;
  price: string | null;
  scrapedImages: { url: string; alt: string; type: string }[];
  selectedImages: { url: string; alt: string; type: string }[];
  error?: string;
}

interface ScrapeResult {
  categoryUrl: string;
  totalFound: number;
  products: ProductResult[];
}

const DEFAULT_CATEGORY =
  "https://www.jcrew.com/c/mens_category/sweaters";

export default function TestScrapePage() {
  const [url, setUrl] = useState(DEFAULT_CATEGORY);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState("");
  const handleScrape = useCallback(async () => {
    setError("");
    setLoading(true);
    setResult(null);
    setProgress("Fetching category page and scraping products...");

    try {
      const res = await fetch("/api/scrape-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, limit: 20 }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setResult(data);
      setProgress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scrape");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const successCount = result
    ? result.products.filter((p) => !p.error && p.selectedImages.length >= 3)
        .length
    : 0;
  const totalCount = result?.products.length ?? 0;

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl tracking-wide font-serif">
            Image Selection Test
          </h1>
          <a
            href="/"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            &larr; Back to Generator
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-stone-500 mb-6">
          Paste a J.Crew category page URL. This will scrape the first 20
          products and show which images would be auto-selected for video
          generation (model shots preferred).
        </p>

        <div className="flex gap-3 mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.jcrew.com/c/mens_category/sweaters"
            className="flex-1 px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900 placeholder:text-stone-400"
            onKeyDown={(e) => e.key === "Enter" && !loading && handleScrape()}
          />
          <button
            onClick={handleScrape}
            disabled={!url || loading}
            className="px-8 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
          >
            {loading ? "Scraping..." : "Scrape Category"}
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block mb-4">
              <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
            </div>
            <p className="text-stone-500">{progress}</p>
            <p className="text-sm text-stone-400 mt-1">
              This scrapes each product sequentially and may take 30-60 seconds
              for 20 products.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {result && (
          <>
            {/* Summary */}
            <div className="mb-8 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <div className="flex items-center gap-6 text-sm">
                <span>
                  <strong>{totalCount}</strong> products scraped
                </span>
                <span className="text-green-700">
                  <strong>{successCount}</strong> have 3 valid images
                </span>
                <span className="text-red-700">
                  <strong>{totalCount - successCount}</strong> issues
                </span>
              </div>
            </div>

            {/* Product grid */}
            <div className="space-y-8">
              {result.products.map((product, idx) => (
                <div
                  key={idx}
                  className={`border rounded-xl p-6 ${
                    product.error || product.selectedImages.length < 3
                      ? "border-red-200 bg-red-50/30"
                      : "border-stone-200"
                  }`}
                >
                  {/* Product header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-stone-900">
                        <span className="text-stone-400 mr-2">#{idx + 1}</span>
                        {product.title || "Unknown"}
                      </h3>
                      <p className="text-sm text-stone-500">
                        {product.price || "No price"} &mdash;{" "}
                        {product.scrapedImages.length} total images
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {product.selectedImages.length >= 3 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          3 images selected
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          Only {product.selectedImages.length} images
                        </span>
                      )}
                    </div>
                  </div>

                  {product.error && (
                    <p className="text-red-600 text-sm mb-4">
                      Error: {product.error}
                    </p>
                  )}

                  {/* Selected images (the 3 that would go to Kling) */}
                  {product.selectedImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                        Selected for Video (auto-selected model shots)
                      </p>
                      <div className="flex gap-3">
                        {product.selectedImages.map((img, i) => (
                          <div key={i} className="relative">
                            <div className="w-32 h-44 rounded-lg overflow-hidden bg-stone-100 border-2 border-stone-900">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.alt}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </div>
                            <span
                              className={`absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                                img.type === "model"
                                  ? "bg-green-100 text-green-700"
                                  : img.type === "flat"
                                    ? "bg-blue-100 text-blue-700"
                                    : img.type === "detail"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-stone-100 text-stone-600"
                              }`}
                            >
                              {img.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All images strip */}
                  <details className="group">
                    <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600 select-none">
                      Show all {product.scrapedImages.length} images
                    </summary>
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {product.scrapedImages.map((img, i) => {
                        const isSelected = product.selectedImages.some(
                              (s) => s.url === img.url
                            );
                        return (
                          <div
                            key={i}
                            className={`flex-shrink-0 relative ${
                              isSelected ? "ring-2 ring-stone-900 rounded-lg" : ""
                            }`}
                          >
                            <div className="w-20 h-28 rounded-lg overflow-hidden bg-stone-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.alt}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-stone-200 text-stone-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                              {i + 1}
                            </div>
                            <span
                              className={`absolute bottom-0.5 left-0.5 px-1 py-0 text-[9px] rounded-full ${
                                img.type === "model"
                                  ? "bg-green-100 text-green-700"
                                  : img.type === "detail"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-stone-100 text-stone-500"
                              }`}
                            >
                              {img.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
