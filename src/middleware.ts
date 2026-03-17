import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const previewOnly = process.env.NEXT_PUBLIC_PREVIEW_ONLY === "true";

  if (previewOnly) {
    const { pathname } = request.nextUrl;

    if (pathname === "/") {
      return NextResponse.redirect(new URL("/preview", request.url));
    }

    if (pathname.startsWith("/api/generate-video") || pathname.startsWith("/api/scrape")) {
      return NextResponse.json({ error: "Generation is disabled on this site" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/generate-video", "/api/scrape", "/api/scrape-category"],
};
