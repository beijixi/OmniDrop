import { randomBytes } from "node:crypto";

import { EntryType, Prisma } from "@prisma/client";

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
  q?: string;
  type?: string;
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

type EntryCursor = {
  createdAt: Date;
  id: string;
};

export async function getEntries(filters: EntryFilters): Promise<EntryWithRelations[]> {
  const whereParts = buildEntryWhereParts(filters);

  return prisma.entry.findMany({
    where: whereParts.length ? { AND: whereParts } : undefined,
    include: entryInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100
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
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
            message,
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
        orderBy: [{ createdAt: "desc" }, { id: "desc" }]
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
              originalName: {
                contains: query,
                mode: "insensitive"
              }
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
