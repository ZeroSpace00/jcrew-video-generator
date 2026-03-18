import * as cheerio from "cheerio";
import type { ScrapedImage, ScrapedProduct } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/**
 * Classify a J.Crew image by its URL suffix.
 *  (no suffix) or _ed/_edm = main/editorial model shot
 *  _m, _m2, _m3           = model alternate angles
 *  _d, _d1, _d2, _d3      = detail / close-up shots
 *  _flat                   = flat lay
 *  _sw                     = color swatch
 */
function classifyBySuffix(filename: string): ScrapedImage["type"] {
  // filename looks like "CQ908_SR8494_m" or "CO474_BL5678"
  const parts = filename.split("_");
  if (parts.length < 3) return "model"; // no suffix = main shot (model on body)
  const suffix = parts.slice(2).join("_").toLowerCase();
  if (/^m\d*$/.test(suffix)) return "model";
  if (/^ed/.test(suffix) || /^edm/.test(suffix)) return "model";
  if (/^d\d*$/.test(suffix)) return "detail";
  if (/^flat/.test(suffix)) return "flat";
  if (/^e\d*$/.test(suffix)) return "model";
  return "unknown";
}

function normalizeImageUrl(src: string): string {
  if (!src) return "";
  try {
    const parsed = new URL(src);
    // Upgrade to high-res
    parsed.searchParams.set("hei", "1200");
    // Remove crop for full image
    parsed.searchParams.delete("crop");
    return parsed.toString();
  } catch {
    return src;
  }
}

export async function scrapeJCrewProduct(
  url: string
): Promise<ScrapedProduct> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch page: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // --- Extract product info from __NEXT_DATA__ ---
  let title = "";
  let price = "";

  const nextDataScript = $("#__NEXT_DATA__").html();
  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript);
      const productsByCode =
        nextData?.props?.initialState?.products?.productsByProductCode || {};
      const codes = Object.keys(productsByCode);
      if (codes.length > 0) {
        const p = productsByCode[codes[0]];
        title = p.productName || "";
        price = p.colorsList?.[0]?.price?.formatted || "";
      }
    } catch {
      // fall through to DOM-based extraction
    }
  }

  // Fallback title/price from meta tags
  if (!title) {
    title =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().split("|")[0].trim();
    title = title.replace(/\s*\|\s*J\.?Crew.*$/i, "").trim();
  }
  if (!price) {
    price =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('[class*="price"]').first().text().trim() ||
      "";
    if (price && !price.startsWith("$")) price = "$" + price;
  }

  // --- Extract images from the product gallery ---
  // The gallery div: ProductGallery__product-gallery-container___
  // Each image sits inside: RevampedZoomImage__container___ > .image-wrapper > img
  const images: ScrapedImage[] = [];

  $('[class*="product-gallery-container"] img').each((_, el) => {
    const src = $(el).attr("src") || "";
    if (!src || !src.includes("s7-img-facade")) return;

    const alt = $(el).attr("alt") || title;

    // Extract the filename to classify the shot type
    // URL: https://www.jcrew.com/s7-img-facade/CQ908_SR8494_m?hei=...
    const pathname = new URL(src).pathname; // /s7-img-facade/CQ908_SR8494_m
    const filename = pathname.split("/").pop() || "";
    const type = classifyBySuffix(filename);

    images.push({
      url: normalizeImageUrl(src),
      alt,
      type,
      selected: false,
    });
  });

  // Select the first 3 gallery images in order
  const withSelection = images.map((img, i) => ({
    ...img,
    selected: i < 3,
  }));

  return {
    title: title || "Unknown Product",
    price: price || "Price not found",
    url,
    images: withSelection,
  };
}
