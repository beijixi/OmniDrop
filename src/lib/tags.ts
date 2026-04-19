import { prisma } from "@/lib/prisma";
import { normalizeTagList } from "@/lib/utils";

const DEFAULT_TAG_LIMIT = 24;

export type TagSummary = {
  entryCount: number;
  name: string;
};

export function normalizeTagNames(input: unknown): string[] {
  if (Array.isArray(input)) {
    return normalizeTagList(
      input.filter((value): value is string => typeof value === "string").join(",")
    );
  }

  if (typeof input !== "string") {
    return [];
  }

  return normalizeTagList(input || "");
}

export async function listTagSummaries(limit = DEFAULT_TAG_LIMIT): Promise<TagSummary[]> {
  const rows = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          entries: true
        }
      }
    },
    orderBy: [{ entries: { _count: "desc" } }, { name: "asc" }],
    take: limit
  });

  return rows
    .filter((row) => row._count.entries > 0)
    .map((row) => ({
      entryCount: row._count.entries,
      name: row.name
    }));
}
