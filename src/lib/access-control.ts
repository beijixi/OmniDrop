const encoder = new TextEncoder();

export const accessCookieName = "omnidrop_access";
export const accessCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export function getPublicAccessPassword() {
  return process.env.PUBLIC_ACCESS_PASSWORD?.trim() || "";
}

function getAccessSigningSecret() {
  return process.env.ACCESS_AUTH_SECRET?.trim() || getPublicAccessPassword();
}

export function getRequestHost(input: Headers | HeadersInit): string {
  const headers = input instanceof Headers ? input : new Headers(input);
  const rawHost = headers.get("x-forwarded-host") || headers.get("host") || "";
  return normalizeHost(rawHost);
}

export function getRequestProtocol(input: Headers | HeadersInit, fallbackUrl?: string): string {
  const headers = input instanceof Headers ? input : new Headers(input);
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();

  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  if (fallbackUrl) {
    try {
      return new URL(fallbackUrl).protocol.replace(":", "") || "http";
    } catch {
      return "http";
    }
  }

  return "http";
}

export function getRequestOrigin(input: { headers: Headers | HeadersInit; url?: string }) {
  const host = getRequestHost(input.headers);
  const protocol = getRequestProtocol(input.headers, input.url);

  if (!host) {
    try {
      return new URL(input.url || "http://localhost").origin;
    } catch {
      return "http://localhost";
    }
  }

  return `${protocol}://${host}`;
}

export function createRequestUrl(
  input: { headers: Headers | HeadersInit; url?: string },
  pathname: string
) {
  return new URL(pathname, getRequestOrigin(input));
}

export function isInternalRequestHost(host: string): boolean {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost) {
    return true;
  }

  const internalHost = configuredHostFromUrl(process.env.INTERNAL_APP_URL);

  return normalizedHost === internalHost || isLoopbackHost(normalizedHost);
}

export function shouldRequirePublicAccess(input: { host: string; pathname: string }) {
  if (!getPublicAccessPassword()) {
    return false;
  }

  if (isAuthExemptPath(input.pathname) || isPublicSharePath(input.pathname)) {
    return false;
  }

  if (isInternalRequestHost(input.host)) {
    return false;
  }

  return true;
}

export function isAuthExemptPath(pathname: string) {
  return (
    pathname === "/unlock" ||
    pathname.startsWith("/api/auth/unlock") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  );
}

export function isPublicSharePath(pathname: string) {
  return pathname.startsWith("/share/") || pathname.startsWith("/api/share/");
}

export function sanitizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function createAccessToken() {
  const exp = Date.now() + accessCookieMaxAgeSeconds * 1000;
  const payload = toBase64Url(JSON.stringify({ exp }));
  const signature = await signValue(payload);

  return `${payload}.${signature}`;
}

export async function verifyAccessToken(token: string | undefined | null) {
  if (!token || !getPublicAccessPassword()) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await signValue(payload);

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

async function signValue(value: string) {
  const secret = getAccessSigningSecret();

  if (!secret) {
    return "";
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

function configuredHostFromUrl(value: string | undefined) {
  if (!value?.trim()) {
    return "";
  }

  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return normalizeHost(value);
  }
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function isLoopbackHost(value: string) {
  return (
    value.startsWith("localhost") ||
    value.startsWith("127.0.0.1") ||
    value.startsWith("[::1]") ||
    value.startsWith("::1")
  );
}

function toBase64Url(value: string) {
  return bytesToBase64Url(encoder.encode(value));
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }

  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function bytesToBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
