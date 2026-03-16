"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScrapedProduct, ScrapedImage, Product } from "@/lib/types";
import { saveProduct } from "@/lib/storage";
import { useRouter } from "next/navigation";

type Step = "input" | "images" | "generating" | "review";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<ScrapedProduct | null>(null);
  const [images, setImages] = useState<ScrapedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [genStatus, setGenStatus] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleScrape = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error && !data.product) {
        setError(data.error);
        return;
      }
      const scrapedProduct: ScrapedProduct = data.product;
      setProduct(scrapedProduct);
      setImages(scrapedProduct.images);
      setStep("images");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scrape");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const toggleImage = useCallback((index: number) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, selected: !img.selected } : img
      )
    );
  }, []);

  const selectedImages = images.filter((img) => img.selected);

  const startGeneration = useCallback(
    async (imgs: ScrapedImage[]) => {
      setStep("generating");
      setGenStatus("Submitting to Kling O3 Omni...");
      setVideoUrl("");
      setError("");

      try {
        const primary = imgs[0].url;
        const refs = imgs.slice(1).map((img) => img.url);

        let res: Response;
        try {
          res = await fetch("/api/generate-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              primaryImageUrl: primary,
              referenceImageUrls: refs,
            }),
          });
        } catch (networkErr) {
          console.error("[generate-video] Network error:", networkErr);
          setError(
            `Network error: Could not reach the server. ${networkErr instanceof Error ? networkErr.message : ""}`
          );
          setStep("images");
          return;
        }

        let data: Record<string, unknown>;
        try {
          data = await res.json();
        } catch {
          console.error(
            "[generate-video] Non-JSON response, status:",
            res.status,
            res.statusText
          );
          setError(
            `Server returned an unexpected response (HTTP ${res.status}). Check the terminal for details.`
          );
          setStep("images");
          return;
        }

        if (!res.ok || data.error) {
          const errMsg =
            (data.error as string) ||
            `Server error (HTTP ${res.status}). Check the terminal for details.`;
          console.error("[generate-video] API error:", errMsg, data);
          setError(errMsg);
          setStep("images");
          return;
        }

        if (!data.requestId) {
          console.error(
            "[generate-video] No requestId in response:",
            data
          );
          setError(
            "Server did not return a request ID. The API may be misconfigured."
          );
          setStep("images");
          return;
        }

        setRequestId(data.requestId as string);
        setGenStatus("Queued... waiting for video generation");

        let pollErrorCount = 0;
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch("/api/video-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestId: data.requestId }),
            });

            if (!statusRes.ok) {
              const errBody = await statusRes.text();
              console.error(
                "[video-status] HTTP error:",
                statusRes.status,
                errBody
              );
              pollErrorCount++;
              if (pollErrorCount >= 3) {
                if (pollRef.current) clearInterval(pollRef.current);
                setError(
                  `Lost connection to video status (HTTP ${statusRes.status}). Try regenerating.`
                );
                setStep("images");
              }
              return;
            }

            const statusData = await statusRes.json();
            pollErrorCount = 0;

            if (statusData.error) {
              console.error("[video-status] API error:", statusData.error);
              if (pollRef.current) clearInterval(pollRef.current);
              setError(`Video generation error: ${statusData.error}`);
              setStep("images");
              return;
            }

            if (statusData.status === "COMPLETED" && statusData.videoUrl) {
              if (pollRef.current) clearInterval(pollRef.current);
              setVideoUrl(statusData.videoUrl);
              setGenStatus("Complete!");
              setStep("review");
            } else if (statusData.status === "FAILED") {
              if (pollRef.current) clearInterval(pollRef.current);
              setError(
                "Video generation failed on the server. Please try again with different images or a simpler prompt."
              );
              setStep("images");
            } else {
              setGenStatus(
                statusData.status === "IN_PROGRESS"
                  ? "Generating video..."
                  : statusData.status === "IN_QUEUE"
                    ? "In queue..."
                    : `Status: ${statusData.status}`
              );
            }
          } catch (pollErr) {
            console.error("[video-status] Poll error:", pollErr);
            pollErrorCount++;
            if (pollErrorCount >= 3) {
              if (pollRef.current) clearInterval(pollRef.current);
              setError(
                "Lost connection while checking video status. Please try again."
              );
              setStep("images");
            }
          }
        }, 5000);
      } catch (e) {
        console.error("[startGeneration] Unexpected error:", e);
        setError(
          e instanceof Error ? e.message : "An unexpected error occurred"
        );
        setStep("images");
      }
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (selectedImages.length === 0) {
      setError("Select at least one image");
      return;
    }
    await startGeneration(selectedImages);
  }, [selectedImages, startGeneration]);

  const handleRegenerate = useCallback(async () => {
    if (selectedImages.length === 0) return;
    if (pollRef.current) clearInterval(pollRef.current);
    setVideoUrl("");
    setRequestId("");
    setGenStatus("");
    await startGeneration(selectedImages);
  }, [selectedImages, startGeneration]);

  const handleApprove = useCallback(() => {
    if (!product || !videoUrl) return;
    const saved: Product = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: product.title,
      price: product.price,
      sourceUrl: product.url,
      primaryImageUrl: selectedImages[0]?.url || product.images[0]?.url || "",
      videoUrl,
      createdAt: Date.now(),
    };
    saveProduct(saved);
    router.push("/preview");
  }, [product, videoUrl, selectedImages, router]);

  const handleReset = useCallback(() => {
    setStep("input");
    setUrl("");
    setProduct(null);
    setImages([]);
    setError("");
    setVideoUrl("");
    setRequestId("");
    setGenStatus("");
    setLoading(false);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1
            className="text-2xl tracking-wide font-serif cursor-pointer"
            onClick={handleReset}
          >
            J.Crew Video Generator
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/test-scrape")}
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Test Scraper
            </button>
            <button
              onClick={() => router.push("/preview")}
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Storefront Preview &rarr;
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10 text-sm text-stone-400">
          {(["input", "images", "generating", "review"] as Step[]).map(
            (s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <span className="text-stone-300">/</span>}
                <span
                  className={
                    step === s
                      ? "text-stone-900 font-medium"
                      : ["input", "images", "generating", "review"].indexOf(
                            step
                          ) >
                          ["input", "images", "generating", "review"].indexOf(s)
                        ? "text-stone-500"
                        : ""
                  }
                >
                  {s === "input"
                    ? "URL"
                    : s === "images"
                      ? "Select Images"
                      : s === "generating"
                        ? "Generating"
                        : "Review"}
                </span>
              </span>
            )
          )}
        </div>

        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-300 text-red-800 rounded-lg flex items-start gap-3">
            <span className="text-red-500 text-xl leading-none flex-shrink-0">
              &#9888;
            </span>
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Something went wrong</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {/* Step 1: URL Input */}
        {step === "input" && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-serif mb-2">
              Paste a J.Crew product URL
            </h2>
            <p className="text-stone-500 mb-8">
              We&apos;ll scrape the product gallery images so you can pick which
              ones to use for the video.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Product URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.jcrew.com/p/..."
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900 placeholder:text-stone-400"
                  onKeyDown={(e) =>
                    e.key === "Enter" && !loading && handleScrape()
                  }
                />
              </div>

              <button
                onClick={handleScrape}
                disabled={!url || loading}
                className="px-8 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Scraping...
                  </span>
                ) : (
                  "Scrape Product"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Image Selection */}
        {step === "images" && product && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-serif mb-1">{product.title}</h2>
              <p className="text-stone-500 text-lg">{product.price}</p>
            </div>

            <p className="text-sm text-stone-500 mb-4">
              {selectedImages.length} of {images.length} images selected. Click
              to toggle. Image 1 will be used as the starting frame.
            </p>

            <div className="flex gap-4 mb-8">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => toggleImage(i)}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    img.selected
                      ? "border-stone-900 ring-2 ring-stone-900/20"
                      : "border-transparent hover:border-stone-300"
                  }`}
                >
                  <div className="w-36 h-48 bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute top-2 left-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                        img.type === "model"
                          ? "bg-green-100 text-green-700"
                          : img.type === "detail"
                            ? "bg-amber-100 text-amber-700"
                            : img.type === "flat"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {img.type}
                    </span>
                  </div>
                  {img.selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {selectedImages.indexOf(img) + 1}
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-1 font-mono">
                    Gallery #{i + 1}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerate}
                disabled={selectedImages.length === 0}
                className="px-8 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Generate Video ({selectedImages.length} image
                {selectedImages.length !== 1 ? "s" : ""})
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 text-stone-500 hover:text-stone-900 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === "generating" && (
          <div className="text-center py-20">
            <div className="inline-block mb-6">
              <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-serif mb-2">Generating Your Video</h2>
            {product && (
              <p className="text-stone-600 mb-4 font-medium">
                {product.title}
              </p>
            )}
            <p className="text-stone-500 mb-2">{genStatus}</p>
            <p className="text-sm text-stone-400">
              This typically takes 30-90 seconds. Please don&apos;t close this
              page.
            </p>

            {selectedImages.length > 0 && (
              <div className="mt-8 flex justify-center gap-3">
                {selectedImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-24 h-32 rounded-lg overflow-hidden bg-stone-100 border border-stone-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-stone-900/80 text-white text-[10px] text-center py-0.5">
                        start frame
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {requestId && (
              <p className="text-xs text-stone-300 mt-6 font-mono">
                Request: {requestId}
              </p>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === "review" && videoUrl && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-serif mb-2">Review Your Video</h2>
            <p className="text-stone-500 mb-6">
              {product?.title} &mdash; {product?.price}
            </p>

            <div className="rounded-xl overflow-hidden bg-stone-100 mb-8">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleApprove}
                className="px-8 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium"
              >
                Approve &amp; Add to Storefront
              </button>
              <button
                onClick={handleRegenerate}
                className="px-6 py-3 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 text-stone-500 hover:text-stone-900 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
