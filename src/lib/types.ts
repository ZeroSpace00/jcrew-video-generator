export interface ScrapedImage {
  url: string;
  alt: string;
  type: "model" | "flat" | "detail" | "unknown";
  selected: boolean;
}

export interface ScrapedProduct {
  title: string;
  price: string;
  url: string;
  images: ScrapedImage[];
}

export interface VideoJob {
  requestId: string;
  status: "PENDING" | "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  videoUrl?: string;
  error?: string;
}

export interface Product {
  id: string;
  title: string;
  price: string;
  sourceUrl: string;
  primaryImageUrl: string;
  videoUrl: string;
  createdAt: number;
}

export type WorkflowStep = "input" | "images" | "generating" | "review";
