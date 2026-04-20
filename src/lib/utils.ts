export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDateTime(input: Date | string, locale = "zh-CN"): string {
  const value = typeof input === "string" ? new Date(input) : input;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export function normalizeMessageText(raw: string): string | null {
  const normalized = raw.replace(/\r\n/g, "\n").trim();

  return normalized ? normalized : null;
}

export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }

  return /android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini/i.test(userAgent);
}

export function isIpv4Address(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const parts = value.split(".");

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }

    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

export function isPrivateIpv4Address(value: string | null | undefined): boolean {
  if (!isIpv4Address(value)) {
    return false;
  }

  const [first, second] = (value || "").split(".").map(Number);

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export function normalizeTagList(raw: string): string[] {
  return [...new Set(raw.split(/[,\n，]/g))]
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function normalizeExternalUrl(input: string): string | null {
  const candidate = input.startsWith("www.") ? `https://${input}` : input;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function extractExternalUrls(message: string | null | undefined): string[] {
  if (!message) {
    return [];
  }

  const matches = [...message.matchAll(/(?:https?:\/\/|www\.)[^\s<]+/gi)];
  const urls: string[] = [];

  for (const match of matches) {
    const rawUrl = match[0];

    if (!rawUrl) {
      continue;
    }

    const { cleanUrl } = splitTrailingUrlText(rawUrl);
    const normalizedUrl = normalizeExternalUrl(cleanUrl);

    if (normalizedUrl) {
      urls.push(normalizedUrl);
    }
  }

  return [...new Set(urls)];
}

export function extractFirstExternalUrl(message: string | null | undefined): string | null {
  return extractExternalUrls(message)[0] || null;
}

function splitTrailingUrlText(value: string) {
  let cleanUrl = value;
  let trailingText = "";

  while (cleanUrl.length > 0) {
    const lastCharacter = cleanUrl.at(-1);

    if (!lastCharacter) {
      break;
    }

    if (".,!?;:".includes(lastCharacter)) {
      trailingText = `${lastCharacter}${trailingText}`;
      cleanUrl = cleanUrl.slice(0, -1);
      continue;
    }

    if (lastCharacter === ")" && countChar(cleanUrl, ")") > countChar(cleanUrl, "(")) {
      trailingText = `${lastCharacter}${trailingText}`;
      cleanUrl = cleanUrl.slice(0, -1);
      continue;
    }

    if (lastCharacter === "]" && countChar(cleanUrl, "]") > countChar(cleanUrl, "[")) {
      trailingText = `${lastCharacter}${trailingText}`;
      cleanUrl = cleanUrl.slice(0, -1);
      continue;
    }

    break;
  }

  return {
    cleanUrl,
    trailingText
  };
}

function countChar(value: string, character: string) {
  return [...value].filter((item) => item === character).length;
}
