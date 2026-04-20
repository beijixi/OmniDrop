import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizeMessageText } from "@/lib/utils";

export const excerptSourceOptions = ["MESSAGE", "NOTE", "LINK", "ASSET"] as const;

export type ExcerptSource = (typeof excerptSourceOptions)[number];

export const excerptInclude = {
  asset: {
    select: {
      id: true,
      originalName: true
    }
  }
} satisfies Prisma.ExcerptInclude;

export type ExcerptWithRelations = Prisma.ExcerptGetPayload<{
  include: typeof excerptInclude;
}>;

export function isExcerptSource(value: string | null | undefined): value is ExcerptSource {
  return !!value && excerptSourceOptions.includes(value as ExcerptSource);
}

export function getExcerptSourceLabelKey(source: ExcerptSource) {
  switch (source) {
    case "NOTE":
      return "excerpt.source_note" as const;
    case "LINK":
      return "excerpt.source_link" as const;
    case "ASSET":
      return "excerpt.source_asset" as const;
    default:
      return "excerpt.source_message" as const;
  }
}

export async function createExcerpt(input: {
  assetId?: string | null;
  content: string;
  entryId: string;
  note?: string | null;
  source: string;
}): Promise<ExcerptWithRelations> {
  const content = normalizeExcerptContent(input.content);

  if (!content) {
    throw new Error("EXCERPT_EMPTY");
  }

  if (!isExcerptSource(input.source)) {
    throw new Error("INVALID_EXCERPT_SOURCE");
  }

  const note = normalizeExcerptNote(input.note);

  return prisma.$transaction(async (tx) => {
    const entry = await tx.entry.findUnique({
      where: {
        id: input.entryId
      },
      select: {
        id: true
      }
    });

    if (!entry) {
      throw new Error("ENTRY_NOT_FOUND");
    }

    let assetId: string | null = null;

    if (input.assetId) {
      const asset = await tx.asset.findFirst({
        where: {
          entryId: input.entryId,
          id: input.assetId
        },
        select: {
          id: true
        }
      });

      if (!asset) {
        throw new Error("EXCERPT_ASSET_NOT_FOUND");
      }

      assetId = asset.id;
    }

    return tx.excerpt.create({
      data: {
        assetId,
        content,
        entryId: input.entryId,
        note,
        source: input.source
      },
      include: excerptInclude
    });
  });
}

function normalizeExcerptContent(raw: string) {
  const normalized = normalizeMessageText(raw);

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 4000);
}

function normalizeExcerptNote(raw: string | null | undefined) {
  const normalized = normalizeMessageText(raw || "");

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 1000);
}
