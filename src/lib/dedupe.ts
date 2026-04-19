import { createHash } from "node:crypto";

import { normalizeMessageText } from "@/lib/utils";

const trackingParams = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "si",
  "spm"
]);

export type DuplicateKind = "asset" | "text" | "url";

export type EntryDuplicateSummary = {
  count: number;
  kind: DuplicateKind;
};

export function buildContentHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function buildMessageFingerprint(message: string | null | undefined): string | null {
  const normalized = normalizeMessageForDedupe(message);

  if (!normalized) {
    return null;
  }

  return createHash("sha256").update(normalized).digest("hex");
}

export function extractCanonicalUrlFromMessage(message: string | null | undefined): string | null {
  const normalized = normalizeMessageText(message || "");

  if (!normalized || /\s/.test(normalized)) {
    return null;
  }

  return normalizeUrlForDedupe(normalized);
}

export function normalizeMessageForDedupe(message: string | null | undefined): string | null {
  const normalized = normalizeMessageText(message || "");

  if (!normalized) {
    return null;
  }

  return normalized.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

export function normalizeUrlForDedupe(input: string): string | null {
  const candidate = input.startsWith("www.") ? `https://${input}` : input;

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.protocol = parsed.protocol.toLocaleLowerCase();
    parsed.hostname = parsed.hostname.toLocaleLowerCase();
    parsed.hash = "";

    for (const key of [...parsed.searchParams.keys()]) {
      if (key.toLocaleLowerCase().startsWith("utm_") || trackingParams.has(key.toLocaleLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }

    const sortedParams = [...parsed.searchParams.entries()].sort(([left], [right]) => left.localeCompare(right));
    parsed.search = "";
    sortedParams.forEach(([key, value]) => parsed.searchParams.append(key, value));

    if (parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
