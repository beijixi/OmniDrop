import { lookup } from "node:dns/promises";

import { prisma } from "@/lib/prisma";
import { extractFirstExternalUrl, isIpv4Address, isPrivateIpv4Address } from "@/lib/utils";

export type LinkFetchStatus = "BLOCKED" | "FAILED" | "IDLE" | "PENDING" | "PROCESSING" | "SUCCESS";

type LinkPreviewRecord = {
  description: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  siteName: string | null;
  textContent: string | null;
  title: string | null;
  url: string;
};

type IndexLinkPreviewEntry = {
  canonicalUrl: string | null;
  id: string;
  linkFetchedAt?: Date | null;
  linkFetchStatus?: string | null;
  message: string | null;
};

type IndexLinkPreviewOptions = {
  force?: boolean;
};

type BackfillLinkPreviewOptions = {
  batchSize?: number;
  force?: boolean;
  limit?: number;
};

const FETCH_TIMEOUT_MS = 7000;
const MAX_BACKFILL_BATCH_SIZE = 100;
const MAX_HTML_BYTES = 800_000;

export async function indexEntryLinkPreviews(
  entries: IndexLinkPreviewEntry[],
  options: IndexLinkPreviewOptions = {}
) {
  let indexed = 0;
  let failed = 0;

  for (const entry of entries) {
    if (!options.force && entry.linkFetchStatus === "SUCCESS") {
      continue;
    }

    const linkUrl = resolveEntryLinkUrl(entry);

    if (!linkUrl) {
      if (options.force || (entry.linkFetchStatus && entry.linkFetchStatus !== "IDLE")) {
        await prisma.entry.update({
          where: {
            id: entry.id
          },
          data: {
            canonicalUrl: null,
            linkContentText: null,
            linkDescription: null,
            linkFetchError: null,
            linkFetchedAt: null,
            linkFetchRequestedAt: null,
            linkFetchStatus: "IDLE",
            linkImageUrl: null,
            linkPublishedAt: null,
            linkSiteName: null,
            linkTitle: null
          }
        });
      }

      continue;
    }

    await prisma.entry.update({
      where: {
        id: entry.id
      },
      data: {
        canonicalUrl: linkUrl,
        linkFetchError: null,
        linkFetchRequestedAt: new Date(),
        linkFetchStatus: "PROCESSING"
      }
    });

    try {
      const preview = await fetchLinkPreview(linkUrl);

      await prisma.entry.update({
        where: {
          id: entry.id
        },
        data: {
          canonicalUrl: preview.url,
          linkContentText: preview.textContent,
          linkDescription: preview.description,
          linkFetchError: null,
          linkFetchedAt: new Date(),
          linkFetchStatus: "SUCCESS",
          linkImageUrl: preview.imageUrl,
          linkPublishedAt: preview.publishedAt,
          linkSiteName: preview.siteName,
          linkTitle: preview.title
        }
      });
      indexed += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed to index link preview for entry ${entry.id}`, error);

      const errorCode = error instanceof Error ? error.message : "LINK_FETCH_FAILED";
      const status = errorCode.startsWith("LINK_FETCH_BLOCKED") ? "BLOCKED" : "FAILED";

      await prisma.entry.update({
        where: {
          id: entry.id
        },
        data: {
          linkFetchError: errorCode.slice(0, 240),
          linkFetchedAt: null,
          linkFetchStatus: status
        }
      });
    }
  }

  return {
    failed,
    indexed
  };
}

export async function refreshEntryLinkPreview(entryId: string) {
  const entry = await prisma.entry.findUnique({
    where: {
      id: entryId
    },
    select: {
      canonicalUrl: true,
      id: true,
      linkFetchStatus: true,
      message: true
    }
  });

  if (!entry) {
    throw new Error("ENTRY_NOT_FOUND");
  }

  await indexEntryLinkPreviews([entry], {
    force: true
  });
}

export async function backfillLinkPreviews(options: BackfillLinkPreviewOptions = {}) {
  const batchSize = Math.max(1, Math.min(options.batchSize ?? 20, MAX_BACKFILL_BATCH_SIZE));
  const limit = options.limit && options.limit > 0 ? options.limit : Infinity;
  let cursorId: string | undefined;
  let indexed = 0;
  let failed = 0;

  while (indexed + failed < limit) {
    const remaining = Number.isFinite(limit)
      ? Math.min(batchSize, Math.max(1, limit - indexed - failed))
      : batchSize;

    const entries = await prisma.entry.findMany({
      where: {
        ...(cursorId
          ? {
              id: {
                gt: cursorId
              }
            }
          : {}),
        OR: [
          {
            canonicalUrl: {
              not: null
            }
          },
          {
            message: {
              contains: "http",
              mode: "insensitive"
            }
          },
          {
            message: {
              contains: "www.",
              mode: "insensitive"
            }
          }
        ],
        ...(options.force
          ? {}
          : {
              linkFetchStatus: {
                not: "SUCCESS"
              }
            })
      },
      orderBy: {
        id: "asc"
      },
      select: {
        canonicalUrl: true,
        id: true,
        linkFetchedAt: true,
        linkFetchStatus: true,
        message: true
      },
      take: remaining
    });

    if (entries.length === 0) {
      break;
    }

    const result = await indexEntryLinkPreviews(entries, {
      force: true
    });

    indexed += result.indexed;
    failed += result.failed;
    cursorId = entries[entries.length - 1]?.id;
  }

  return {
    failed,
    indexed
  };
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewRecord> {
  await assertSafePreviewUrl(url);

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "OmniDropBot/1.0 (+link-preview)"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`LINK_FETCH_FAILED_${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("LINK_FETCH_UNSUPPORTED_CONTENT_TYPE");
    }

    const html = await readResponseText(response);
    const finalUrl = response.url || url;
    const metadata = extractMetadataFromHtml(html, finalUrl);

    return {
      description: metadata.description,
      imageUrl: metadata.imageUrl,
      publishedAt: metadata.publishedAt,
      siteName: metadata.siteName,
      textContent: metadata.textContent,
      title: metadata.title,
      url: finalUrl
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function resolveEntryLinkUrl(entry: Pick<IndexLinkPreviewEntry, "canonicalUrl" | "message">) {
  return entry.canonicalUrl || extractFirstExternalUrl(entry.message);
}

async function assertSafePreviewUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  const hostname = parsed.hostname.toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".local") || !hostname.includes(".")) {
    throw new Error("LINK_FETCH_BLOCKED_HOST");
  }

  if (isIpv4Address(hostname) && isPrivateIpv4Address(hostname)) {
    throw new Error("LINK_FETCH_BLOCKED_PRIVATE_IP");
  }

  const resolved = await lookup(hostname, {
    all: true
  }).catch(() => []);

  for (const address of resolved) {
    if (address.family === 4 && isPrivateIpv4Address(address.address)) {
      throw new Error("LINK_FETCH_BLOCKED_PRIVATE_IP");
    }

    if (address.family === 6 && isPrivateIpv6Address(address.address)) {
      throw new Error("LINK_FETCH_BLOCKED_PRIVATE_IP");
    }
  }
}

async function readResponseText(response: Response) {
  const reader = response.body?.getReader();

  if (!reader) {
    return response.text();
  }

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > MAX_HTML_BYTES) {
      throw new Error("LINK_FETCH_RESPONSE_TOO_LARGE");
    }

    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());
  return chunks.join("");
}

function extractMetadataFromHtml(html: string, baseUrl: string) {
  const title =
    normalizePreviewText(readMetaTag(html, "property", "og:title")) ||
    normalizePreviewText(readMetaTag(html, "name", "twitter:title")) ||
    normalizePreviewText(readTitle(html));
  const description =
    normalizePreviewText(readMetaTag(html, "property", "og:description")) ||
    normalizePreviewText(readMetaTag(html, "name", "description")) ||
    normalizePreviewText(readMetaTag(html, "name", "twitter:description"));
  const siteName =
    normalizePreviewText(readMetaTag(html, "property", "og:site_name")) ||
    normalizePreviewText(new URL(baseUrl).hostname.replace(/^www\./, ""));
  const imageUrl = normalizePreviewUrl(
    readMetaTag(html, "property", "og:image") || readMetaTag(html, "name", "twitter:image"),
    baseUrl
  );
  const publishedAt = normalizeDateTime(
    readMetaTag(html, "property", "article:published_time") ||
      readMetaTag(html, "name", "pubdate") ||
      readMetaTag(html, "name", "date")
  );
  const textContent = extractReadableText(html);

  return {
    description,
    imageUrl,
    publishedAt,
    siteName,
    textContent,
    title
  };
}

function readMetaTag(html: string, attribute: "name" | "property", value: string) {
  const pattern = new RegExp(
    `<meta[^>]*${attribute}=["']${escapeRegExp(value)}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attribute}=["']${escapeRegExp(value)}["'][^>]*>`,
    "i"
  );

  return decodeHtmlEntities(pattern.exec(html)?.[1] || reversePattern.exec(html)?.[1] || "");
}

function readTitle(html: string) {
  return decodeHtmlEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function extractReadableText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const article = withoutScripts.match(/<article[\s\S]*?<\/article>/i)?.[0] || withoutScripts;
  const text = decodeHtmlEntities(article.replace(/<[^>]+>/g, " "));
  const compact = text.replace(/\s+/g, " ").trim();

  return compact ? compact.slice(0, 12000) : null;
}

function normalizePreviewText(value: string | null | undefined) {
  const compact = value?.replace(/\s+/g, " ").trim();
  return compact ? compact.slice(0, 4000) : null;
}

function normalizePreviewUrl(value: string | null | undefined, baseUrl: string) {
  const compact = value?.trim();

  if (!compact) {
    return null;
  }

  try {
    return new URL(compact, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeDateTime(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPrivateIpv6Address(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}
