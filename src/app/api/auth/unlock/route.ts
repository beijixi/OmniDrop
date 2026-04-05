import { NextRequest, NextResponse } from "next/server";

import {
  accessCookieMaxAgeSeconds,
  accessCookieName,
  createRequestUrl,
  createAccessToken,
  getPublicAccessPassword,
  getRequestProtocol,
  sanitizeNextPath
} from "@/lib/access-control";
import {
  clearPublicAccessFailures,
  getPublicAccessAttemptState,
  recordPublicAccessFailure,
  verifyPublicAccessCaptchaChallenge
} from "@/lib/public-access-guard";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const nextPath = sanitizeNextPath(String(formData.get("next") || "/"));
  const captchaId = String(formData.get("captchaId") || "");
  const captchaAnswer = String(formData.get("captchaAnswer") || "");
  const currentAttemptState = getPublicAccessAttemptState(request.headers);

  if (
    currentAttemptState.requiresCaptcha &&
    !verifyPublicAccessCaptchaChallenge(request.headers, captchaId, captchaAnswer)
  ) {
    const nextAttemptState = recordPublicAccessFailure(request.headers);

    return createUnlockErrorResponse(request, nextPath, nextAttemptState.requiresCaptcha);
  }

  if (!getPublicAccessPassword() || password !== getPublicAccessPassword()) {
    const nextAttemptState = recordPublicAccessFailure(request.headers);

    return createUnlockErrorResponse(request, nextPath, nextAttemptState.requiresCaptcha);
  }

  clearPublicAccessFailures(request.headers);

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

function createUnlockErrorResponse(request: Request, nextPath: string, requiresCaptcha: boolean) {
  const redirectUrl = createRequestUrl(request, "/unlock");
  redirectUrl.searchParams.set("next", nextPath);
  redirectUrl.searchParams.set("error", "1");

  if (requiresCaptcha) {
    redirectUrl.searchParams.set("captcha", "1");
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
