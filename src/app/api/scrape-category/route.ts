import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { scrapeJCrewProduct } from "@/lib/scraper";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface CategoryProduct {
  productUrl: string;
  title: string | null;
  price: string | null;
  scrapedImages: {
    url: string;
    alt: string;
    type: string;
  }[];
  selectedImages: {
    url: string;
    alt: string;
    type: string;
  }[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, limit = 20 } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL is required" },
        { status: 400 }
      );
    }

    // Fetch the category page
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch category page: ${response.status}` },
        { status: 500 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract product URLs from __NEXT_DATA__
    const nextDataScript = $("#__NEXT_DATA__").html();
    if (!nextDataScript) {
      return NextResponse.json(
        { error: "No __NEXT_DATA__ found. This may not be a valid J.Crew category page." },
        { status: 400 }
      );
    }

    const nextData = JSON.parse(nextDataScript);
    const jsonStr = nextDataScript;

    // Extract unique product URLs from __NEXT_DATA__
    const urlMatches = jsonStr.match(/"\/p\/[^"]+"/g) || [];
    const productPaths = [
      ...new Set(
        urlMatches.map((m: string) => {
          let path = m.replace(/^"/, "").replace(/"$/, "");
          path = path.replace(/\\u0026/g, "&");
          // Strip query params for deduplication
          return path.split("?")[0];
        })
      ),
    ].slice(0, limit) as string[];

    if (productPaths.length === 0) {
      return NextResponse.json(
        { error: "No product URLs found on this category page." },
        { status: 400 }
      );
    }

    // Scrape each product page (sequentially to be polite to J.Crew)
    const results: CategoryProduct[] = [];

    for (const path of productPaths) {
      const fullUrl = `https://www.jcrew.com${path}`;
      try {
        const scraped = await scrapeJCrewProduct(fullUrl);
        const allImages = scraped.images;
        // Use the auto-selected images (model shots preferred by scraper)
        const selected = allImages.filter((img) => img.selected);

        results.push({
          productUrl: fullUrl,
          title: scraped.title,
          price: scraped.price,
          scrapedImages: allImages.map((img) => ({
            url: img.url,
            alt: img.alt,
            type: img.type,
          })),
          selectedImages: selected.map((img) => ({
            url: img.url,
            alt: img.alt,
            type: img.type,
          })),
        });
      } catch (e) {
        results.push({
          productUrl: fullUrl,
          title: null,
          price: null,
          scrapedImages: [],
          selectedImages: [],
          error: e instanceof Error ? e.message : "Failed to scrape",
        });
      }
    }

    return NextResponse.json({
      categoryUrl: url,
      totalFound: productPaths.length,
      products: results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
