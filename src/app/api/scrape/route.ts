import { NextRequest, NextResponse } from "next/server";
import { scrapeJCrewProduct } from "@/lib/scraper";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL is required" },
        { status: 400 }
      );
    }

    if (!url.includes("jcrew.com") && !url.includes("jcrew.")) {
      return NextResponse.json(
        { error: "Please provide a J.Crew product URL" },
        { status: 400 }
      );
    }

    const product = await scrapeJCrewProduct(url);

    if (product.images.length === 0) {
      return NextResponse.json(
        {
          error:
            "No images found on the page. The page may require JavaScript rendering.",
          product,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
