import { NextResponse } from "next/server";

import { getPublicAccessCaptchaSvg } from "@/lib/public-access-guard";

export function GET(request: Request) {
  const challengeId = new URL(request.url).searchParams.get("id");
  const svg = getPublicAccessCaptchaSvg(challengeId);

  if (!svg) {
    return new NextResponse("Not Found", {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex"
      },
      status: 404
    });
  }

  return new NextResponse(svg, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Robots-Tag": "noindex"
    },
    status: 200
  });
}
