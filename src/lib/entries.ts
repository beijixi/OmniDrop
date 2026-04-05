import { randomBytes } from "node:crypto";

import { EntryType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resolveEntryType } from "@/lib/file-types";
import type { SavedUpload } from "@/lib/storage";
import { removeStoredFiles, removeStoredRelativePaths } from "@/lib/storage";
import { splitMessageBlocks } from "@/lib/utils";

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

export async function getEntries(filters: EntryFilters): Promise<EntryWithRelations[]> {
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

  return prisma.entry.findMany({
    where: whereParts.length ? { AND: whereParts } : undefined,
    include: entryInclude,
    orderBy: {
      createdAt: "desc"
    },
    take: 100
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
  const messageBlocks = splitMessageBlocks(input.message || "");
  const senderName = input.sender.senderName.trim() || "当前设备";
  const senderIp = input.sender.senderIp?.trim() || null;
  const senderHost = input.sender.senderHost?.trim() || null;

  if (messageBlocks.length === 0 && uploads.length === 0) {
    throw new Error("EMPTY_ENTRY");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const entryIds: string[] = [];

      for (const message of messageBlocks) {
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
        orderBy: {
          createdAt: "desc"
        }
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

  await removeStoredRelativePaths(entry.assets.map((asset) => asset.relativePath));
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

function isEntryType(value?: string): value is EntryType {
  return !!value && value !== "ALL" && Object.values(EntryType).includes(value as EntryType);
}
