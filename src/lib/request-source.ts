import { reverse } from "node:dns/promises";
import os from "node:os";

import { isIpv4Address } from "@/lib/utils";

export type SenderInfo = {
  senderHost: string | null;
  senderIp: string | null;
  senderName: string;
};

export async function resolveSenderFromRequest(request: Request): Promise<SenderInfo> {
  const hostHeader = request.headers.get("host") || "";
  const headerIp = getClientIpv4FromHeaders(request.headers);
  const fallbackIp = isLocalHostHeader(hostHeader) ? "127.0.0.1" : null;
  const senderIp = headerIp || fallbackIp;
  let senderHost: string | null = null;

  if (senderIp === "127.0.0.1") {
    senderHost = os.hostname();
  } else if (senderIp) {
    try {
      const names = await reverse(senderIp);
      senderHost = names[0] || null;
    } catch {
      senderHost = null;
    }
  }

  if (!senderHost && isLocalHostHeader(hostHeader)) {
    senderHost = os.hostname();
  }

  return {
    senderHost,
    senderIp,
    senderName: senderHost || senderIp || "current-device"
  };
}

export function getClientIpv4FromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get("x-forwarded-for"),
    headers.get("x-real-ip"),
    headers.get("cf-connecting-ip"),
    headers.get("forwarded")
  ];

  for (const candidate of candidates) {
    const parsed = parseIpCandidate(candidate);

    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export function resolveViewerIpv4FromHeaders(headers: Headers): string | null {
  const hostHeader = headers.get("host") || "";
  return getClientIpv4FromHeaders(headers) || (isLocalHostHeader(hostHeader) ? "127.0.0.1" : null);
}

function parseIpCandidate(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  const firstValue = raw.split(",")[0]?.trim();

  if (!firstValue) {
    return null;
  }

  let value = firstValue
    .split(";")[0]
    .replace(/^for=/i, "")
    .replace(/^"|"$/g, "")
    .trim();

  if (value.startsWith("[")) {
    const endIndex = value.indexOf("]");

    if (endIndex > 0) {
      value = value.slice(1, endIndex);
    }
  } else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(value)) {
    value = value.slice(0, value.lastIndexOf(":"));
  }

  return isIpv4Address(value) ? value : null;
}

export function isLocalHostHeader(hostHeader: string): boolean {
  return hostHeader.startsWith("localhost") || hostHeader.startsWith("127.0.0.1");
}
