import { getRequestHost } from "@/lib/access-control";
import { getClientIpv4FromHeaders } from "@/lib/request-source";

type FailureState = {
  failedAttempts: number;
  updatedAt: number;
  windowStartedAt: number;
};

type CaptchaChallenge = {
  answer: string;
  clientKey: string;
  expiresAt: number;
};

type GuardStore = {
  challenges: Map<string, CaptchaChallenge>;
  failures: Map<string, FailureState>;
  lastCleanupAt: number;
};

export type PublicAccessAttemptState = {
  failedAttempts: number;
  requiresCaptcha: boolean;
};

export type PublicAccessCaptchaChallenge = {
  id: string;
  imageUrl: string;
};

const CAPTCHA_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CAPTCHA_LENGTH = 5;
const CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_CAPTCHA_THRESHOLD = 3;
const DEFAULT_CAPTCHA_TTL_MINUTES = 5;
const DEFAULT_ATTEMPT_WINDOW_MINUTES = 15;

const globalStore = globalThis as typeof globalThis & {
  __omnidropPublicAccessGuard?: GuardStore;
};

function getGuardStore() {
  if (!globalStore.__omnidropPublicAccessGuard) {
    globalStore.__omnidropPublicAccessGuard = {
      challenges: new Map(),
      failures: new Map(),
      lastCleanupAt: 0
    };
  }

  return globalStore.__omnidropPublicAccessGuard;
}

export function getPublicAccessAttemptState(input: Headers | HeadersInit): PublicAccessAttemptState {
  cleanupGuardStore();

  const failureState = readFailureState(getPublicAccessClientKey(input));

  if (!failureState) {
    return {
      failedAttempts: 0,
      requiresCaptcha: false
    };
  }

  return {
    failedAttempts: failureState.failedAttempts,
    requiresCaptcha: failureState.failedAttempts >= getCaptchaThreshold()
  };
}

export function recordPublicAccessFailure(input: Headers | HeadersInit): PublicAccessAttemptState {
  cleanupGuardStore();

  const now = Date.now();
  const clientKey = getPublicAccessClientKey(input);
  const existingState = readFailureState(clientKey);
  const nextState: FailureState = existingState
    ? {
        ...existingState,
        failedAttempts: existingState.failedAttempts + 1,
        updatedAt: now
      }
    : {
        failedAttempts: 1,
        updatedAt: now,
        windowStartedAt: now
      };

  getGuardStore().failures.set(clientKey, nextState);

  return {
    failedAttempts: nextState.failedAttempts,
    requiresCaptcha: nextState.failedAttempts >= getCaptchaThreshold()
  };
}

export function clearPublicAccessFailures(input: Headers | HeadersInit) {
  cleanupGuardStore();

  const clientKey = getPublicAccessClientKey(input);
  const store = getGuardStore();

  store.failures.delete(clientKey);

  for (const [challengeId, challenge] of store.challenges.entries()) {
    if (challenge.clientKey === clientKey) {
      store.challenges.delete(challengeId);
    }
  }
}

export function createPublicAccessCaptchaChallenge(
  input: Headers | HeadersInit
): PublicAccessCaptchaChallenge {
  cleanupGuardStore();

  const clientKey = getPublicAccessClientKey(input);
  const store = getGuardStore();

  for (const [challengeId, challenge] of store.challenges.entries()) {
    if (challenge.clientKey === clientKey) {
      store.challenges.delete(challengeId);
    }
  }

  const id = crypto.randomUUID();
  store.challenges.set(id, {
    answer: generateCaptchaAnswer(),
    clientKey,
    expiresAt: Date.now() + getCaptchaTtlMs()
  });

  return {
    id,
    imageUrl: `/api/auth/captcha?id=${encodeURIComponent(id)}`
  };
}

export function verifyPublicAccessCaptchaChallenge(
  input: Headers | HeadersInit,
  challengeId: string,
  answer: string
) {
  cleanupGuardStore();

  if (!challengeId || !answer.trim()) {
    return false;
  }

  const clientKey = getPublicAccessClientKey(input);
  const store = getGuardStore();
  const challenge = store.challenges.get(challengeId);

  if (!challenge) {
    return false;
  }

  store.challenges.delete(challengeId);

  if (challenge.clientKey !== clientKey || challenge.expiresAt <= Date.now()) {
    return false;
  }

  return normalizeCaptchaAnswer(answer) === challenge.answer;
}

export function getPublicAccessCaptchaSvg(challengeId: string | null | undefined) {
  cleanupGuardStore();

  if (!challengeId) {
    return null;
  }

  const challenge = getGuardStore().challenges.get(challengeId);

  if (!challenge || challenge.expiresAt <= Date.now()) {
    return null;
  }

  return renderCaptchaSvg(challenge.answer, challengeId);
}

function getPublicAccessClientKey(input: Headers | HeadersInit) {
  const headers = input instanceof Headers ? input : new Headers(input);
  const ipv4 = getClientIpv4FromHeaders(headers);

  if (ipv4) {
    return `ip:${ipv4}`;
  }

  const host = getRequestHost(headers) || "unknown-host";
  const userAgent = headers.get("user-agent")?.trim().slice(0, 160) || "unknown-agent";
  const language = headers.get("accept-language")?.split(",")[0]?.trim().toLowerCase() || "unknown-lang";

  return `fingerprint:${host}|${userAgent}|${language}`;
}

function readFailureState(clientKey: string) {
  const store = getGuardStore();
  const state = store.failures.get(clientKey);

  if (!state) {
    return null;
  }

  if (state.updatedAt + getAttemptWindowMs() <= Date.now()) {
    store.failures.delete(clientKey);
    return null;
  }

  return state;
}

function cleanupGuardStore() {
  const store = getGuardStore();
  const now = Date.now();

  if (store.lastCleanupAt && now - store.lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  store.lastCleanupAt = now;

  for (const [clientKey, state] of store.failures.entries()) {
    if (state.updatedAt + getAttemptWindowMs() <= now) {
      store.failures.delete(clientKey);
    }
  }

  for (const [challengeId, challenge] of store.challenges.entries()) {
    if (challenge.expiresAt <= now) {
      store.challenges.delete(challengeId);
    }
  }
}

function getAttemptWindowMs() {
  return getPositiveIntFromEnv(
    "PUBLIC_ACCESS_ATTEMPT_WINDOW_MINUTES",
    DEFAULT_ATTEMPT_WINDOW_MINUTES
  ) * 60_000;
}

function getCaptchaThreshold() {
  return getPositiveIntFromEnv("PUBLIC_ACCESS_CAPTCHA_THRESHOLD", DEFAULT_CAPTCHA_THRESHOLD);
}

function getCaptchaTtlMs() {
  return getPositiveIntFromEnv("PUBLIC_ACCESS_CAPTCHA_TTL_MINUTES", DEFAULT_CAPTCHA_TTL_MINUTES) * 60_000;
}

function getPositiveIntFromEnv(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function generateCaptchaAnswer() {
  let value = "";

  for (let index = 0; index < CAPTCHA_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * CAPTCHA_ALPHABET.length);
    value += CAPTCHA_ALPHABET[randomIndex];
  }

  return value;
}

function normalizeCaptchaAnswer(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function renderCaptchaSvg(answer: string, seed: string) {
  const random = createSeededRandom(seed);
  const width = 164;
  const height = 56;
  const backgroundBubbles = Array.from({ length: 5 }, (_, index) => {
    const radius = 10 + random() * 18;
    const cx = 12 + random() * (width - 24);
    const cy = 8 + random() * (height - 16);
    const opacity = 0.08 + index * 0.02;

    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(
      1
    )}" fill="rgba(14,165,233,${opacity.toFixed(2)})" />`;
  }).join("");
  const lines = Array.from({ length: 6 }, () => {
    const x1 = random() * width;
    const y1 = random() * height;
    const x2 = random() * width;
    const y2 = random() * height;
    const strokeWidth = 1 + random() * 1.6;

    return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(
      1
    )}" stroke="rgba(15,23,42,0.18)" stroke-width="${strokeWidth.toFixed(1)}" stroke-linecap="round" />`;
  }).join("");
  const glyphs = answer
    .split("")
    .map((char, index) => {
      const x = 18 + index * 26 + random() * 4;
      const y = 35 + random() * 7;
      const rotation = -14 + random() * 28;
      const fontSize = 24 + random() * 4;

      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize.toFixed(
        1
      )}" font-weight="700" fill="#0f172a" transform="rotate(${rotation.toFixed(1)} ${x.toFixed(
        1
      )} ${y.toFixed(1)})">${char}</text>`;
    })
    .join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-label="captcha">
  <rect width="${width}" height="${height}" rx="18" fill="url(#bg)" />
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" stroke="rgba(255,255,255,0.72)" />
  ${backgroundBubbles}
  ${lines}
  ${glyphs}
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F8FAFC" />
      <stop offset="1" stop-color="#DFF4FF" />
    </linearGradient>
  </defs>
</svg>`.trim();
}

function createSeededRandom(seed: string) {
  let state = 0;

  for (let index = 0; index < seed.length; index += 1) {
    state = (state * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}
