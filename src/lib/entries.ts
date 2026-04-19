import { randomBytes } from "node:crypto";

import { Prisma, EntryType } from "@prisma/client";

import {
  buildMessageFingerprint,
  extractCanonicalUrlFromMessage,
  type DuplicateKind,
  type EntryDuplicateSummary
} from "@/lib/dedupe";
import { normalizeEntryView } from "@/lib/entry-views";
import { prisma } from "@/lib/prisma";
import { resolveEntryType } from "@/lib/file-types";
import type { SavedUpload } from "@/lib/storage";
import { removeStoredAssets, removeStoredFiles } from "@/lib/storage";
import { normalizeMessageText } from "@/lib/utils";

const DEFAULT_ENTRY_PAGE_SIZE = 20;
const MAX_ENTRY_PAGE_SIZE = 50;

export const entryInclude = {
  assets: {
    orderBy: {
      createdAt: "asc"
    }
  },
  shareLink: true
} satisfies Prisma.EntryInclude;

export type EntryWithRelations = Prisma.EntryGetPayload<{
  include: typeof entryInclude;
}>;

export type EntryFilters = {
  duplicatesOnly?: boolean;
  q?: string;
  type?: string;
  view?: string;
};

export type EntryPageFilters = EntryFilters & {
  cursor?: string;
  limit?: number;
};

export type EntryPageResult = {
  entries: EntryWithRelations[];
  limit: number;
  nextCursor: string | null;
};

export type EntrySearchSnippetSource = "assetName" | "assetText" | "message" | "sender";

export type EntrySearchSnippet = {
  assetName?: string;
  source: EntrySearchSnippetSource;
  text: string;
};

export type EntrySearchMatch = {
  relevanceScore: number;
  sources: EntrySearchSnippetSource[];
  snippets: EntrySearchSnippet[];
} | null;

export type TimelineEntry = EntryWithRelations & {
  duplicateSummary: EntryDuplicateSummary | null;
  searchMatch: EntrySearchMatch;
};

type EntryCursor = {
  createdAt: Date;
  id: string;
};

export async function getEntries(filters: EntryFilters): Promise<TimelineEntry[]> {
  const whereParts = buildEntryWhereParts(filters);
  const rows = await prisma.entry.findMany({
    where: whereParts.length ? { AND: whereParts } : undefined,
    include: entryInclude,
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: filters.duplicatesOnly ? 180 : 100
  });
  const duplicateSummaries = await buildDuplicateSummaryMap(rows);
  const entries = rows.map((entry) => ({
    ...entry,
    duplicateSummary: duplicateSummaries.get(entry.id) || null,
    searchMatch: buildEntrySearchMatch(entry, filters.q)
  }));

  const filteredEntries = filters.duplicatesOnly
    ? entries.filter((entry) => Boolean(entry.duplicateSummary && entry.duplicateSummary.count > 1))
    : entries;

  if (!filters.q?.trim()) {
    return filteredEntries;
  }

  return filteredEntries.sort((left, right) => {
    const leftPinned = left.pinnedAt ? new Date(left.pinnedAt).getTime() : 0;
    const rightPinned = right.pinnedAt ? new Date(right.pinnedAt).getTime() : 0;

    if (rightPinned !== leftPinned) {
      return rightPinned - leftPinned;
    }

    const leftScore = left.searchMatch?.relevanceScore || 0;
    const rightScore = right.searchMatch?.relevanceScore || 0;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

export async function listEntriesPage(filters: EntryPageFilters): Promise<EntryPageResult> {
  const limit = normalizeEntryPageSize(filters.limit);
  const whereParts = buildEntryWhereParts(filters);
  const cursor = decodeEntryCursor(filters.cursor);

  if (filters.cursor && !cursor) {
    throw new Error("INVALID_CURSOR");
  }

  if (cursor) {
    whereParts.push({
      OR: [
        {
          createdAt: {
            lt: cursor.createdAt
          }
        },
        {
          AND: [
            {
              createdAt: cursor.createdAt
            },
            {
              id: {
                lt: cursor.id
              }
            }
          ]
        }
      ]
    });
  }

  const rows = await prisma.entry.findMany({
    where: whereParts.length ? { AND: whereParts } : undefined,
    include: entryInclude,
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit + 1
  });

  const entries = rows.slice(0, limit);
  const nextCursor =
    rows.length > limit && entries.length > 0 ? encodeEntryCursor(entries[entries.length - 1]) : null;

  return {
    entries,
    limit,
    nextCursor
  };
}

export async function getEntryById(entryId: string): Promise<EntryWithRelations | null> {
  return prisma.entry.findUnique({
    where: {
      id: entryId
    },
    include: entryInclude
  });
}

export async function createEntriesBatch(input: {
  message?: string | null;
  uploads?: SavedUpload[];
  sender: {
    senderHost?: string | null;
    senderIp?: string | null;
    senderName: string;
  };
}): Promise<EntryWithRelations[]> {
  const uploads = input.uploads || [];
  const message = normalizeMessageText(input.message || "");
  const senderName = input.sender.senderName.trim() || "current-device";
  const senderIp = input.sender.senderIp?.trim() || null;
  const senderHost = input.sender.senderHost?.trim() || null;

  if (!message && uploads.length === 0) {
    throw new Error("EMPTY_ENTRY");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const entryIds: string[] = [];

      if (message) {
        const entry = await tx.entry.create({
          data: {
            canonicalUrl: extractCanonicalUrlFromMessage(message),
            message,
            messageFingerprint: buildMessageFingerprint(message),
            senderHost,
            senderIp,
            senderName,
            type: EntryType.TEXT
          }
        });

        entryIds.push(entry.id);
      }

      for (const upload of uploads) {
        const entry = await tx.entry.create({
          data: {
            senderHost,
            senderIp,
            senderName,
            type: resolveEntryType([upload.kind]),
            assets: {
              create: {
                contentHash: upload.contentHash,
                kind: upload.kind,
                mimeType: upload.mimeType,
                originalName: upload.originalName,
                relativePath: upload.relativePath,
                size: upload.size,
                storageDriver: upload.storageDriver,
                storedName: upload.storedName
              }
            }
          }
        });

        entryIds.push(entry.id);
      }

      return tx.entry.findMany({
        where: {
          id: {
            in: entryIds
          }
        },
        include: entryInclude,
        orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }]
      });
    });
  } catch (error) {
    if (uploads.length > 0) {
      await removeStoredFiles(uploads);
    }

    throw error;
  }
}

export async function createShareLink(entryId: string) {
  const entry = await prisma.entry.findUnique({
    where: {
      id: entryId
    },
    select: {
      id: true
    }
  });

  if (!entry) {
    throw new Error("ENTRY_NOT_FOUND");
  }

  const existing = await prisma.shareLink.findUnique({
    where: {
      entryId
    }
  });

  if (existing && !existing.revokedAt) {
    return existing;
  }

  const token = randomBytes(12).toString("hex");

  if (existing) {
    return prisma.shareLink.update({
      where: {
        entryId
      },
      data: {
        revokedAt: null,
        token
      }
    });
  }

  return prisma.shareLink.create({
    data: {
      entryId,
      token
    }
  });
}

export async function updateEntryState(
  entryId: string,
  input: {
    archived?: boolean;
    favorite?: boolean;
    pinned?: boolean;
  }
) {
  const existing = await prisma.entry.findUnique({
    where: {
      id: entryId
    },
    select: {
      archivedAt: true,
      id: true
      ,
      pinnedAt: true
    }
  });

  if (!existing) {
    throw new Error("ENTRY_NOT_FOUND");
  }

  const data: Prisma.EntryUpdateInput = {};

  if (typeof input.favorite === "boolean") {
    data.isFavorite = input.favorite;
  }

  if (typeof input.archived === "boolean") {
    data.archivedAt = input.archived ? existing.archivedAt || new Date() : null;
  }

  if (typeof input.pinned === "boolean") {
    data.pinnedAt = input.pinned ? existing.pinnedAt || new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("EMPTY_UPDATE");
  }

  return prisma.entry.update({
    where: {
      id: entryId
    },
    data,
    include: entryInclude
  });
}

export async function revokeShareLink(entryId: string) {
  const existing = await prisma.shareLink.findUnique({
    where: {
      entryId
    }
  });

  if (!existing || existing.revokedAt) {
    return existing;
  }

  return prisma.shareLink.update({
    where: {
      entryId
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function deleteEntry(entryId: string) {
  const entry = await prisma.entry.findUnique({
    where: {
      id: entryId
    },
    include: {
      assets: true
    }
  });

  if (!entry) {
    throw new Error("ENTRY_NOT_FOUND");
  }

  await prisma.entry.delete({
    where: {
      id: entryId
    }
  });

  await removeStoredAssets(
    entry.assets.map((asset) => ({
      relativePath: asset.relativePath,
      storageDriver: asset.storageDriver
    }))
  );
}

export async function cleanupDuplicateEntries(entryId: string) {
  const entry = await prisma.entry.findUnique({
    where: {
      id: entryId
    },
    include: {
      assets: true
    }
  });

  if (!entry) {
    throw new Error("ENTRY_NOT_FOUND");
  }

  const lookup = getEntryDuplicateLookup(entry);

  if (!lookup) {
    throw new Error("DUPLICATE_CLEANUP_UNAVAILABLE");
  }

  const duplicates = await prisma.entry.findMany({
    where: {
      AND: [
        buildDuplicateEntriesWhere(lookup),
        {
          id: {
            not: entryId
          }
        }
      ]
    },
    include: {
      assets: true
    }
  });

  if (duplicates.length === 0) {
    return {
      deletedCount: 0
    };
  }

  await prisma.entry.deleteMany({
    where: {
      id: {
        in: duplicates.map((item) => item.id)
      }
    }
  });

  await removeStoredAssets(
    duplicates.flatMap((duplicate) =>
      duplicate.assets.map((asset) => ({
        relativePath: asset.relativePath,
        storageDriver: asset.storageDriver
      }))
    )
  );

  return {
    deletedCount: duplicates.length
  };
}

export async function getSharedEntry(token: string): Promise<EntryWithRelations | null> {
  const shareLink = await prisma.shareLink.findFirst({
    where: {
      token,
      revokedAt: null
    },
    include: {
      entry: {
        include: entryInclude
      }
    }
  });

  return shareLink?.entry || null;
}

function buildEntryWhereParts(filters: EntryFilters): Prisma.EntryWhereInput[] {
  const query = filters.q?.trim();
  const type = isEntryType(filters.type) ? filters.type : undefined;
  const view = normalizeEntryView(filters.view);
  const whereParts: Prisma.EntryWhereInput[] = [];

  if (query) {
    whereParts.push({
      OR: [
        {
          message: {
            contains: query,
            mode: "insensitive"
          }
        },
        {
          assets: {
            some: {
              OR: [
                {
                  originalName: {
                    contains: query,
                    mode: "insensitive"
                  }
                },
                {
                  searchText: {
                    contains: query,
                    mode: "insensitive"
                  }
                }
              ]
            }
          }
        },
        {
          senderName: {
            contains: query,
            mode: "insensitive"
          }
        },
        {
          senderHost: {
            contains: query,
            mode: "insensitive"
          }
        },
        {
          senderIp: {
            contains: query,
            mode: "insensitive"
          }
        }
      ]
    });
  }

  if (type) {
    whereParts.push({ type });
  }

  if (view === "ACTIVE") {
    whereParts.push({
      archivedAt: null
    });
  }

  if (view === "FAVORITES") {
    whereParts.push({
      archivedAt: null,
      isFavorite: true
    });
  }

  if (view === "ARCHIVED") {
    whereParts.push({
      archivedAt: {
        not: null
      }
    });
  }

  return whereParts;
}

function isEntryType(value?: string): value is EntryType {
  return !!value && value !== "ALL" && Object.values(EntryType).includes(value as EntryType);
}

function normalizeEntryPageSize(value?: number): number {
  if (!value || Number.isNaN(value)) {
    return DEFAULT_ENTRY_PAGE_SIZE;
  }

  return Math.max(1, Math.min(MAX_ENTRY_PAGE_SIZE, Math.floor(value)));
}

function encodeEntryCursor(entry: EntryWithRelations): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: entry.createdAt.toISOString(),
      id: entry.id
    }),
    "utf8"
  ).toString("base64url");
}

function decodeEntryCursor(value?: string): EntryCursor | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      createdAt?: string;
      id?: string;
    };

    if (!parsed.createdAt || !parsed.id) {
      return null;
    }

    const createdAt = new Date(parsed.createdAt);

    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return {
      createdAt,
      id: parsed.id
    };
  } catch {
    return null;
  }
}

type DuplicateLookup = {
  key: string;
  kind: DuplicateKind;
};

function getEntryDuplicateLookup(entry: Pick<EntryWithRelations, "assets" | "canonicalUrl" | "messageFingerprint">) {
  if (entry.assets.length === 1 && entry.assets[0]?.contentHash) {
    return {
      key: entry.assets[0].contentHash,
      kind: "asset"
    } satisfies DuplicateLookup;
  }

  if (entry.canonicalUrl) {
    return {
      key: entry.canonicalUrl,
      kind: "url"
    } satisfies DuplicateLookup;
  }

  if (entry.messageFingerprint) {
    return {
      key: entry.messageFingerprint,
      kind: "text"
    } satisfies DuplicateLookup;
  }

  return null;
}

function buildDuplicateEntriesWhere(lookup: DuplicateLookup): Prisma.EntryWhereInput {
  if (lookup.kind === "asset") {
    return {
      assets: {
        some: {
          contentHash: lookup.key
        }
      }
    };
  }

  if (lookup.kind === "url") {
    return {
      canonicalUrl: lookup.key
    };
  }

  return {
    messageFingerprint: lookup.key
  };
}

async function buildDuplicateSummaryMap(entries: EntryWithRelations[]) {
  const assetHashes = new Set<string>();
  const canonicalUrls = new Set<string>();
  const messageFingerprints = new Set<string>();

  entries.forEach((entry) => {
    const lookup = getEntryDuplicateLookup(entry);

    if (!lookup) {
      return;
    }

    if (lookup.kind === "asset") {
      assetHashes.add(lookup.key);
      return;
    }

    if (lookup.kind === "url") {
      canonicalUrls.add(lookup.key);
      return;
    }

    messageFingerprints.add(lookup.key);
  });

  const [matchingAssets, matchingEntries] = await Promise.all([
    assetHashes.size > 0
      ? prisma.asset.findMany({
          where: {
            contentHash: {
              in: [...assetHashes]
            }
          },
          select: {
            contentHash: true,
            entryId: true
          }
        })
      : Promise.resolve([]),
    canonicalUrls.size > 0 || messageFingerprints.size > 0
      ? prisma.entry.findMany({
          where: {
            OR: [
              canonicalUrls.size > 0
                ? {
                    canonicalUrl: {
                      in: [...canonicalUrls]
                    }
                  }
                : undefined,
              messageFingerprints.size > 0
                ? {
                    messageFingerprint: {
                      in: [...messageFingerprints]
                    }
                  }
                : undefined
            ].filter(Boolean) as Prisma.EntryWhereInput[]
          },
          select: {
            canonicalUrl: true,
            id: true,
            messageFingerprint: true
          }
        })
      : Promise.resolve([])
  ]);

  const countByAssetHash = new Map<string, number>();
  const countByCanonicalUrl = new Map<string, number>();
  const countByMessageFingerprint = new Map<string, number>();

  matchingAssets.forEach((asset) => {
    if (!asset.contentHash) {
      return;
    }

    countByAssetHash.set(asset.contentHash, (countByAssetHash.get(asset.contentHash) || 0) + 1);
  });

  matchingEntries.forEach((entry) => {
    if (entry.canonicalUrl) {
      countByCanonicalUrl.set(entry.canonicalUrl, (countByCanonicalUrl.get(entry.canonicalUrl) || 0) + 1);
    }

    if (entry.messageFingerprint) {
      countByMessageFingerprint.set(
        entry.messageFingerprint,
        (countByMessageFingerprint.get(entry.messageFingerprint) || 0) + 1
      );
    }
  });

  const summaryMap = new Map<string, EntryDuplicateSummary>();

  entries.forEach((entry) => {
    const lookup = getEntryDuplicateLookup(entry);

    if (!lookup) {
      return;
    }

    const count =
      lookup.kind === "asset"
        ? countByAssetHash.get(lookup.key) || 0
        : lookup.kind === "url"
          ? countByCanonicalUrl.get(lookup.key) || 0
          : countByMessageFingerprint.get(lookup.key) || 0;

    if (count > 1) {
      summaryMap.set(entry.id, {
        count,
        kind: lookup.kind
      });
    }
  });

  return summaryMap;
}

function buildEntrySearchMatch(entry: EntryWithRelations, query?: string): EntrySearchMatch {
  const normalizedQuery = query?.trim();

  if (!normalizedQuery) {
    return null;
  }

  const snippets: EntrySearchSnippet[] = [];
  const sourceSet = new Set<EntrySearchSnippetSource>();
  let relevanceScore = 0;

  const pushSnippet = (snippet: EntrySearchSnippet | null) => {
    if (!snippet || snippets.length >= 4) {
      return;
    }

    sourceSet.add(snippet.source);
    snippets.push(snippet);
    relevanceScore += getSourceRelevance(snippet.source);
  };

  const messageSnippet = entry.message ? createSearchSnippet(entry.message, normalizedQuery) : null;
  pushSnippet(
    messageSnippet
      ? {
          source: "message",
          text: messageSnippet
        }
      : null
  );

  const senderSnippet = [entry.senderName, entry.senderHost, entry.senderIp].filter(Boolean).join(" · ");
  const matchedSenderSnippet = senderSnippet ? createSearchSnippet(senderSnippet, normalizedQuery) : null;
  pushSnippet(
    matchedSenderSnippet
      ? {
          source: "sender",
          text: matchedSenderSnippet
        }
      : null
  );

  entry.assets.forEach((asset) => {
    if (snippets.length >= 4) {
      return;
    }

    const nameSnippet = createSearchSnippet(asset.originalName, normalizedQuery, { radius: 18 });

    if (nameSnippet) {
      pushSnippet({
        assetName: asset.originalName,
        source: "assetName",
        text: nameSnippet
      });
      return;
    }

    if (!asset.searchText) {
      return;
    }

    const assetTextSnippet = createSearchSnippet(asset.searchText, normalizedQuery, { compactWhitespace: true });

    if (assetTextSnippet) {
      pushSnippet({
        assetName: asset.originalName,
        source: "assetText",
        text: assetTextSnippet
      });
    }
  });

  if (snippets.length === 0) {
    return null;
  }

  return {
    relevanceScore,
    snippets,
    sources: [...sourceSet]
  };
}

function createSearchSnippet(
  value: string,
  query: string,
  input?: {
    compactWhitespace?: boolean;
    radius?: number;
  }
): string | null {
  const compacted = input?.compactWhitespace ? value.replace(/\s+/g, " ").trim() : value;
  const index = compacted.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());

  if (index === -1) {
    return null;
  }

  const radius = input?.radius || 40;
  const start = Math.max(0, index - radius);
  const end = Math.min(compacted.length, index + query.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < compacted.length ? "…" : "";

  return `${prefix}${compacted.slice(start, end).trim()}${suffix}`;
}

function getSourceRelevance(source: EntrySearchSnippetSource) {
  switch (source) {
    case "message":
      return 40;
    case "assetName":
      return 30;
    case "assetText":
      return 20;
    case "sender":
      return 10;
    default:
      return 0;
  }
}
