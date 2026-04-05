import { NextRequest, NextResponse } from "next/server";

import {
  accessCookieName,
  createRequestUrl,
  getRequestHost,
  sanitizeNextPath,
  shouldRequirePublicAccess,
  verifyAccessToken
} from "@/lib/access-control";

export async function middleware(request: NextRequest) {
  const host = getRequestHost(request.headers);
  const { pathname, search } = request.nextUrl;

  if (
    !shouldRequirePublicAccess({
      host,
      pathname
    })
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(accessCookieName)?.value;

  if (await verifyAccessToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: {
          message: "AUTH_REQUIRED"
        },
        ok: false
      },
      { status: 401 }
    );
  }

  const unlockUrl = createRequestUrl(request, "/unlock");
  unlockUrl.searchParams.set("next", sanitizeNextPath(`${pathname}${search}`));

  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
