import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";

import { entryInclude, type EntryWithRelations } from "@/lib/entries";
import { prisma } from "@/lib/prisma";
import { normalizeMessageText } from "@/lib/utils";

const MAX_COLLECTION_SUMMARIES = 48;

export const collectionInclude = {
  entries: {
    include: {
      entry: {
        include: entryInclude
      }
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  },
  shareLink: true
} satisfies Prisma.CollectionInclude;

export type CollectionWithEntries = Prisma.CollectionGetPayload<{
  include: typeof collectionInclude;
}>;

export type CollectionSummary = {
  description: string | null;
  entryCount: number;
  hasActiveShare: boolean;
  id: string;
  title: string;
  updatedAt: string;
};

export async function getCollectionSummaries(): Promise<CollectionSummary[]> {
  const rows = await prisma.collection.findMany({
    include: {
      _count: {
        select: {
          entries: true
        }
      },
      shareLink: {
        select: {
          revokedAt: true
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: MAX_COLLECTION_SUMMARIES
  });

  return rows.map((row) => ({
    description: row.description,
    entryCount: row._count.entries,
    hasActiveShare: Boolean(row.shareLink && !row.shareLink.revokedAt),
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString()
  }));
}

export async function getCollectionById(collectionId: string): Promise<CollectionWithEntries | null> {
  return prisma.collection.findUnique({
    where: {
      id: collectionId
    },
    include: collectionInclude
  });
}

export async function getSharedCollection(token: string): Promise<CollectionWithEntries | null> {
  const shareLink = await prisma.collectionShareLink.findFirst({
    where: {
      revokedAt: null,
      token
    },
    include: {
      collection: {
        include: collectionInclude
      }
    }
  });

  return shareLink?.collection || null;
}

export async function createCollection(input: {
  description?: string | null;
  entryIds?: string[];
  title: string;
}): Promise<CollectionWithEntries> {
  const title = normalizeCollectionTitle(input.title);
  const description = normalizeCollectionDescription(input.description);
  const entryIds = normalizeEntryIds(input.entryIds || []);

  return prisma.$transaction(async (tx) => {
    const collection = await tx.collection.create({
      data: {
        description,
        title
      }
    });

    if (entryIds.length > 0) {
      await appendEntriesToCollectionTx(tx, collection.id, entryIds);
    }

    const created = await tx.collection.findUnique({
      where: {
        id: collection.id
      },
      include: collectionInclude
    });

    if (!created) {
      throw new Error("COLLECTION_NOT_FOUND");
    }

    return created;
  });
}

export async function updateCollection(collectionId: string, input: {
  description?: string | null;
  title?: string;
}): Promise<CollectionWithEntries> {
  const existing = await prisma.collection.findUnique({
    where: {
      id: collectionId
    },
    select: {
      id: true
    }
  });

  if (!existing) {
    throw new Error("COLLECTION_NOT_FOUND");
  }

  const data: Prisma.CollectionUpdateInput = {};

  if (typeof input.title === "string") {
    data.title = normalizeCollectionTitle(input.title);
  }

  if (input.description !== undefined) {
    data.description = normalizeCollectionDescription(input.description);
  }

  if (Object.keys(data).length === 0) {
    throw new Error("EMPTY_COLLECTION_UPDATE");
  }

  return prisma.collection.update({
    where: {
      id: collectionId
    },
    data,
    include: collectionInclude
  });
}

export async function addEntriesToCollection(collectionId: string, entryIdsInput: string[]) {
  const entryIds = normalizeEntryIds(entryIdsInput);

  if (entryIds.length === 0) {
    throw new Error("EMPTY_ENTRY_BATCH");
  }

  return prisma.$transaction(async (tx) => {
    const collection = await tx.collection.findUnique({
      where: {
        id: collectionId
      },
      select: {
        id: true
      }
    });

    if (!collection) {
      throw new Error("COLLECTION_NOT_FOUND");
    }

    const result = await appendEntriesToCollectionTx(tx, collectionId, entryIds);
    await touchCollectionTx(tx, collectionId);

    return result;
  });
}

export async function removeEntryFromCollection(collectionId: string, entryId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.collectionEntry.findUnique({
      where: {
        collectionId_entryId: {
          collectionId,
          entryId
        }
      },
      select: {
        collectionId: true
      }
    });

    if (!existing) {
      throw new Error("COLLECTION_ENTRY_NOT_FOUND");
    }

    await tx.collectionEntry.delete({
      where: {
        collectionId_entryId: {
          collectionId,
          entryId
        }
      }
    });
    await touchCollectionTx(tx, collectionId);
  });
}

export async function moveCollectionEntry(collectionId: string, entryId: string, direction: "down" | "up") {
  return prisma.$transaction(async (tx) => {
    const items = await tx.collectionEntry.findMany({
      where: {
        collectionId
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        collectionId: true,
        createdAt: true,
        entryId: true,
        position: true
      }
    });

    if (items.length === 0) {
      throw new Error("COLLECTION_NOT_FOUND");
    }

    const currentIndex = items.findIndex((item) => item.entryId === entryId);

    if (currentIndex === -1) {
      throw new Error("COLLECTION_ENTRY_NOT_FOUND");
    }

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= items.length) {
      const collection = await tx.collection.findUnique({
        where: {
          id: collectionId
        },
        include: collectionInclude
      });

      if (!collection) {
        throw new Error("COLLECTION_NOT_FOUND");
      }

      return collection;
    }

    const current = items[currentIndex];
    const swapTarget = items[swapIndex];

    await tx.collectionEntry.update({
      where: {
        collectionId_entryId: {
          collectionId: current.collectionId,
          entryId: current.entryId
        }
      },
      data: {
        position: swapTarget.position
      }
    });

    await tx.collectionEntry.update({
      where: {
        collectionId_entryId: {
          collectionId: swapTarget.collectionId,
          entryId: swapTarget.entryId
        }
      },
      data: {
        position: current.position
      }
    });

    await touchCollectionTx(tx, collectionId);

    const collection = await tx.collection.findUnique({
      where: {
        id: collectionId
      },
      include: collectionInclude
    });

    if (!collection) {
      throw new Error("COLLECTION_NOT_FOUND");
    }

    return collection;
  });
}

export async function createCollectionShareLink(collectionId: string) {
  const collection = await prisma.collection.findUnique({
    where: {
      id: collectionId
    },
    select: {
      id: true
    }
  });

  if (!collection) {
    throw new Error("COLLECTION_NOT_FOUND");
  }

  const existing = await prisma.collectionShareLink.findUnique({
    where: {
      collectionId
    }
  });

  if (existing && !existing.revokedAt) {
    return existing;
  }

  const token = randomBytes(12).toString("hex");

  if (existing) {
    return prisma.collectionShareLink.update({
      where: {
        collectionId
      },
      data: {
        revokedAt: null,
        token
      }
    });
  }

  return prisma.collectionShareLink.create({
    data: {
      collectionId,
      token
    }
  });
}

export async function revokeCollectionShareLink(collectionId: string) {
  const existing = await prisma.collectionShareLink.findUnique({
    where: {
      collectionId
    }
  });

  if (!existing || existing.revokedAt) {
    return existing;
  }

  return prisma.collectionShareLink.update({
    where: {
      collectionId
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function deleteCollection(collectionId: string) {
  const collection = await prisma.collection.findUnique({
    where: {
      id: collectionId
    },
    select: {
      id: true
    }
  });

  if (!collection) {
    throw new Error("COLLECTION_NOT_FOUND");
  }

  await prisma.collection.delete({
    where: {
      id: collectionId
    }
  });
}

async function appendEntriesToCollectionTx(tx: Prisma.TransactionClient, collectionId: string, entryIds: string[]) {
  const existingEntries = await tx.entry.findMany({
    where: {
      id: {
        in: entryIds
      }
    },
    select: {
      id: true
    }
  });

  if (existingEntries.length === 0) {
    throw new Error("ENTRY_NOT_FOUND");
  }

  const existingEntryIds = existingEntries.map((entry) => entry.id);
  const existingRelations = await tx.collectionEntry.findMany({
    where: {
      collectionId,
      entryId: {
        in: existingEntryIds
      }
    },
    select: {
      entryId: true
    }
  });
  const existingRelationIds = new Set(existingRelations.map((relation) => relation.entryId));
  const nextEntryIds = existingEntryIds.filter((entryId) => !existingRelationIds.has(entryId));
  const maxPosition = (
    await tx.collectionEntry.aggregate({
      where: {
        collectionId
      },
      _max: {
        position: true
      }
    })
  )._max.position || 0;

  if (nextEntryIds.length > 0) {
    await tx.collectionEntry.createMany({
      data: nextEntryIds.map((entryId, index) => ({
        collectionId,
        entryId,
        position: maxPosition + index + 1
      })),
      skipDuplicates: true
    });
  }

  return {
    addedCount: nextEntryIds.length,
    matchedCount: existingEntryIds.length
  };
}

async function touchCollectionTx(tx: Prisma.TransactionClient, collectionId: string) {
  await tx.collection.update({
    where: {
      id: collectionId
    },
    data: {
      updatedAt: new Date()
    }
  });
}

function normalizeCollectionTitle(value: string) {
  const title = value.trim().slice(0, 120);

  if (!title) {
    throw new Error("EMPTY_COLLECTION_TITLE");
  }

  return title;
}

function normalizeCollectionDescription(value?: string | null) {
  const description = normalizeMessageText(value || "");

  return description ? description.slice(0, 2000) : null;
}

function normalizeEntryIds(entryIds: string[]) {
  return [...new Set(entryIds.map((entryId) => entryId.trim()).filter(Boolean))];
}

export function getCollectionPrimaryEntry(collection: CollectionWithEntries): EntryWithRelations | null {
  return collection.entries[0]?.entry || null;
}
