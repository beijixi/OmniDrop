import { redirect } from "next/navigation";

import { getRequestHost, isInternalRequestHost, sanitizeNextPath } from "@/lib/access-control";
import {
  createPublicAccessCaptchaChallenge,
  getPublicAccessAttemptState
} from "@/lib/public-access-guard";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type UnlockPageProps = {
  searchParams?: {
    captcha?: string;
    error?: string;
    next?: string;
  };
};

export default function UnlockPage({ searchParams }: UnlockPageProps) {
  const host = getRequestHost(headers());

  if (isInternalRequestHost(host)) {
    redirect(sanitizeNextPath(searchParams?.next));
  }

  const nextPath = sanitizeNextPath(searchParams?.next);
  const hasError = searchParams?.error === "1";
  const attemptState = getPublicAccessAttemptState(headers());
  const requiresCaptcha = searchParams?.captcha === "1" || attemptState.requiresCaptcha;
  const captchaChallenge = requiresCaptcha ? createPublicAccessCaptchaChallenge(headers()) : null;
  const helperMessage = hasError
    ? requiresCaptcha
      ? "密码或验证码不正确，请重试。"
      : "密码不正确，请重试。"
    : requiresCaptcha
      ? "连续输错后，需要先完成验证码验证。"
      : "分享链接可直接访问，主应用公网入口需要密码。";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center justify-center px-4">
      <section className="panel-strong w-full overflow-hidden px-6 py-6 sm:px-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="brand-mark">
            <span className="relative z-[1] text-sm font-semibold text-white">O</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">OmniDrop Access</p>
            <p className="mt-1 text-sm text-slate-500">公网访问需要输入访问密码。</p>
          </div>
        </div>

        <form action="/api/auth/unlock" method="post" className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Access Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              className="h-12 w-full rounded-[18px] border border-white/78 bg-white/90 px-4 text-sm text-slate-900 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_12px_28px_rgba(15,23,42,0.06)] transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
              placeholder="Enter password"
            />
          </div>

          {captchaChallenge ? (
            <>
              <input type="hidden" name="captchaId" value={captchaChallenge.id} />

              <div className="space-y-2">
                <label htmlFor="captchaAnswer" className="text-sm font-medium text-slate-700">
                  Verification Code
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={captchaChallenge.imageUrl}
                    alt="captcha"
                    className="h-14 w-[164px] rounded-[18px] border border-white/70 bg-white/80 object-cover shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
                  />
                  <input
                    id="captchaAnswer"
                    name="captchaAnswer"
                    type="text"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    className="h-12 min-w-0 flex-1 rounded-[18px] border border-white/78 bg-white/90 px-4 text-sm uppercase tracking-[0.18em] text-slate-900 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_12px_28px_rgba(15,23,42,0.06)] transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
                    placeholder="ABCDE"
                  />
                </div>
                <p className="text-xs text-slate-500">看不清可以刷新页面获取新的验证码。</p>
              </div>
            </>
          ) : null}

          <p className={hasError ? "text-sm text-rose-600" : "text-sm text-slate-500"}>{helperMessage}</p>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#0f766e_58%,#38bdf8)] px-5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition hover:-translate-y-[1px]"
          >
            Continue
          </button>
        </form>
      </section>
    </div>
  );
}
