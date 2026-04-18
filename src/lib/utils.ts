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
