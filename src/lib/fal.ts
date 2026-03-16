import { fal } from "@fal-ai/client";

export function configureFal(apiKey: string) {
  fal.config({ credentials: apiKey });
}

export interface GenerateVideoInput {
  primaryImageUrl: string;
  referenceImageUrls: string[];
  prompt?: string;
  duration?: string;
}

const MODEL_ID = "fal-ai/kling-video/o3/standard/reference-to-video";

const DEFAULT_PROMPT =
  "A fashion model @Element1 poses and slowly turns around to show the full outfit, turns 360, turns back to face the camera and then walks confidently toward the camera, then walks out of frame. Fashion editorial lighting, smooth cinematic motion, high-end lookbook style.";

export async function submitVideoGeneration(input: GenerateVideoInput) {
  const {
    primaryImageUrl,
    referenceImageUrls,
    prompt = DEFAULT_PROMPT,
    duration = "7",
  } = input;

  const allImageUrls = [primaryImageUrl, ...referenceImageUrls];
  const elements = [
    {
      frontal_image_url: allImageUrls[0],
      reference_image_urls: allImageUrls.slice(1),
    },
  ];

  const { request_id } = await fal.queue.submit(MODEL_ID, {
    input: {
      start_image_url: primaryImageUrl,
      prompt,
      elements,
      duration,
    },
  });

  return request_id;
}

export async function checkVideoStatus(requestId: string) {
  const status = await fal.queue.status(MODEL_ID, {
    requestId,
    logs: false,
  });
  return status;
}

export async function getVideoResult(requestId: string) {
  const result = await fal.queue.result(MODEL_ID, { requestId });
  return result;
}
