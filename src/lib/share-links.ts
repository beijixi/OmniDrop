import { env } from "@/lib/env";
import { getClientIpv4FromHeaders } from "@/lib/request-source";
import { isIpv4Address, isPrivateIpv4Address, trimTrailingSlash } from "@/lib/utils";

export type SharePreferenceMode = "public" | "internal";

export type ShareUrlSet = {
  internalUrl: string | null;
  preferredMode: SharePreferenceMode | null;
  preferredUrl: string | null;
  publicUrl: string | null;
};

type ShareSettingsInput = {
  internalShareBaseUrl?: string | null;
  shareBaseUrl?: string | null;
};

export function buildShareUrlSet(input: {
  path?: string;
  request: Request;
  settings: ShareSettingsInput;
  token: string;
}): ShareUrlSet {
  const publicBaseUrl = sanitizeConfiguredBaseUrl(
    input.settings.shareBaseUrl || env.publicAppUrl
  );
  const currentOrigin = resolveRequestOrigin(input.request);
  const configuredInternalBaseUrl = sanitizeConfiguredBaseUrl(
    input.settings.internalShareBaseUrl || ""
  );
  const internalBaseUrl =
    configuredInternalBaseUrl ||
    (currentOrigin && isInternalOrigin(currentOrigin) ? currentOrigin : null);
  const sharePath = normalizeSharePath(input.path || `/share/${input.token}`);
  const publicUrl = publicBaseUrl ? buildShareUrl(publicBaseUrl, sharePath) : null;
  const internalUrl = internalBaseUrl ? buildShareUrl(internalBaseUrl, sharePath) : null;
  const preferredMode = resolvePreferredMode({
    currentOrigin,
    headers: input.request.headers,
    internalBaseUrl,
    publicBaseUrl
  });
  const preferredUrl =
    preferredMode === "internal"
      ? internalUrl || publicUrl
      : publicUrl || internalUrl;

  return {
    internalUrl,
    preferredMode,
    preferredUrl,
    publicUrl
  };
}

function resolvePreferredMode(input: {
  currentOrigin: string | null;
  headers: Headers;
  internalBaseUrl: string | null;
  publicBaseUrl: string | null;
}): SharePreferenceMode | null {
  if (!input.publicBaseUrl && !input.internalBaseUrl) {
    return null;
  }

  if (input.currentOrigin) {
    if (input.internalBaseUrl && isSameOrigin(input.currentOrigin, input.internalBaseUrl)) {
      return "internal";
    }

    if (input.publicBaseUrl && isSameOrigin(input.currentOrigin, input.publicBaseUrl)) {
      return "public";
    }

    if (input.internalBaseUrl && isInternalOrigin(input.currentOrigin)) {
      return "internal";
    }
  }

  const clientIp = getClientIpv4FromHeaders(input.headers);

  if (input.internalBaseUrl && isPrivateIpv4Address(clientIp)) {
    return "internal";
  }

  if (input.publicBaseUrl) {
    return "public";
  }

  if (input.internalBaseUrl) {
    return "internal";
  }

  return null;
}

function resolveRequestOrigin(request: Request): string | null {
  const forwardedHost = readFirstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = readFirstHeaderValue(request.headers.get("x-forwarded-proto"));
  const hostHeader = readFirstHeaderValue(request.headers.get("host"));
  const originHeader = sanitizeConfiguredBaseUrl(request.headers.get("origin"));

  if (forwardedHost) {
    return sanitizeConfiguredBaseUrl(`${forwardedProto || "https"}://${forwardedHost}`);
  }

  if (originHeader) {
    return originHeader;
  }

  if (hostHeader) {
    const requestUrl = new URL(request.url);
    return sanitizeConfiguredBaseUrl(`${requestUrl.protocol}//${hostHeader}`);
  }

  return sanitizeConfiguredBaseUrl(request.url);
}

function isInternalOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (hostname === "localhost" || hostname.endsWith(".local")) {
      return true;
    }

    if (isIpv4Address(hostname)) {
      return isPrivateIpv4Address(hostname);
    }

    return !hostname.includes(".");
  } catch {
    return false;
  }
}

function isSameOrigin(left: string, right: string): boolean {
  try {
    return new URL(left).origin === new URL(right).origin;
  } catch {
    return false;
  }
}

function buildShareUrl(baseUrl: string, sharePath: string): string {
  return `${trimTrailingSlash(baseUrl)}${sharePath}`;
}

function normalizeSharePath(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "/";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function sanitizeConfiguredBaseUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    return trimTrailingSlash(new URL(value).toString());
  } catch {
    return null;
  }
}

function readFirstHeaderValue(value: string | null): string {
  return value?.split(",")[0]?.trim() || "";
}
