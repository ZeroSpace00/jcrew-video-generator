import { NextRequest, NextResponse } from "next/server";
import { configureFal, submitVideoGeneration } from "@/lib/fal";

export async function POST(request: NextRequest) {
  try {
    const { primaryImageUrl, referenceImageUrls, apiKey, prompt, duration } =
      await request.json();

    if (!primaryImageUrl) {
      return NextResponse.json(
        { error: "A primary image URL is required" },
        { status: 400 }
      );
    }

    const falKey = apiKey || process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: "fal.ai API key is required. Provide it in the UI or set FAL_KEY env var." },
        { status: 400 }
      );
    }

    configureFal(falKey);

    console.log("[generate-video] Submitting to fal.ai with", {
      primaryImageUrl: primaryImageUrl?.slice(0, 80) + "...",
      referenceCount: referenceImageUrls?.length ?? 0,
    });

    const requestId = await submitVideoGeneration({
      primaryImageUrl,
      referenceImageUrls: referenceImageUrls || [],
      prompt,
      duration,
    });

    console.log("[generate-video] Got requestId:", requestId);
    return NextResponse.json({ requestId });
  } catch (error) {
    console.error("[generate-video] Error:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
