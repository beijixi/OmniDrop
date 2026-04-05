import { NextResponse } from "next/server";

import {
  accessCookieMaxAgeSeconds,
  accessCookieName,
  createRequestUrl,
  createAccessToken,
  getPublicAccessPassword,
  getRequestProtocol,
  sanitizeNextPath
} from "@/lib/access-control";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const nextPath = sanitizeNextPath(String(formData.get("next") || "/"));

  if (!getPublicAccessPassword() || password !== getPublicAccessPassword()) {
    const redirectUrl = createRequestUrl(request, "/unlock");
    redirectUrl.searchParams.set("next", nextPath);
    redirectUrl.searchParams.set("error", "1");

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const token = await createAccessToken();
  const response = NextResponse.redirect(createRequestUrl(request, nextPath), { status: 303 });

  response.cookies.set({
    httpOnly: true,
    maxAge: accessCookieMaxAgeSeconds,
    name: accessCookieName,
    path: "/",
    sameSite: "lax",
    secure: getRequestProtocol(request.headers, request.url) === "https",
    value: token
  });

  return response;
}
