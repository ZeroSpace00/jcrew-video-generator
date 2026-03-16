import { NextRequest, NextResponse } from "next/server";
import { configureFal, checkVideoStatus, getVideoResult } from "@/lib/fal";

export async function POST(request: NextRequest) {
  try {
    const { requestId, apiKey } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    const falKey = apiKey || process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: "fal.ai API key is required" },
        { status: 400 }
      );
    }

    configureFal(falKey);

    const status = await checkVideoStatus(requestId);
    console.log("[video-status]", requestId, "->", status.status);

    if (status.status === "COMPLETED") {
      const result = await getVideoResult(requestId);
      const data = result.data as { video?: { url?: string } };
      const videoUrl = data?.video?.url || null;
      console.log("[video-status] Completed, videoUrl:", videoUrl?.slice(0, 80));
      return NextResponse.json({
        status: "COMPLETED",
        videoUrl,
      });
    }

    return NextResponse.json({
      status: status.status,
      videoUrl: null,
    });
  } catch (error) {
    console.error("[video-status] Error:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
