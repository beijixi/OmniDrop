import type { EntryType, SavedView } from "@prisma/client";

import { normalizeEntryView, type EntryView } from "@/lib/entry-views";
import { normalizeEntryTypeOption } from "@/lib/file-types";
import { prisma } from "@/lib/prisma";
import { normalizeTagNames } from "@/lib/tags";

const MAX_SAVED_VIEWS = 12;

export type SavedViewInput = {
  duplicatesOnly?: boolean;
  name: string;
  q?: string | null;
  tag?: string | null;
  type?: string | null;
  view?: string | null;
};

export type SavedViewSummary = {
  duplicatesOnly: boolean;
  entryType: EntryType | "ALL";
  entryView: EntryView;
  id: string;
  name: string;
  query: string;
  tagName: string;
  updatedAt: string;
};

export async function getSavedViews(): Promise<SavedViewSummary[]> {
  const rows = await prisma.savedView.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: MAX_SAVED_VIEWS
  });

  return rows.map(serializeSavedView);
}

export async function createSavedView(input: SavedViewInput): Promise<SavedViewSummary> {
  const normalized = normalizeSavedViewInput(input);

  if (!normalized) {
    throw new Error("EMPTY_SAVED_VIEW");
  }

  const existing = await prisma.savedView.findFirst({
    where: {
      name: normalized.name
    }
  });

  const savedView = existing
    ? await prisma.savedView.update({
        where: {
          id: existing.id
        },
        data: normalized
      })
    : await prisma.savedView.create({
        data: normalized
      });

  return serializeSavedView(savedView);
}

export async function deleteSavedView(id: string): Promise<void> {
  const existing = await prisma.savedView.findUnique({
    where: {
      id
    },
    select: {
      id: true
    }
  });

  if (!existing) {
    throw new Error("SAVED_VIEW_NOT_FOUND");
  }

  await prisma.savedView.delete({
    where: {
      id
    }
  });
}

function normalizeSavedViewInput(input: SavedViewInput): Omit<SavedView, "createdAt" | "id" | "updatedAt"> | null {
  const name = input.name.trim().slice(0, 64);
  const query = input.q?.trim() || null;
  const tagName = normalizeTagNames(input.tag || "").at(0) || null;
  const entryType = normalizeEntryTypeOption(input.type);
  const entryView = normalizeEntryView(input.view);
  const duplicatesOnly = Boolean(input.duplicatesOnly);

  if (!name) {
    throw new Error("EMPTY_SAVED_VIEW_NAME");
  }

  if (!query && !tagName && entryType === "ALL" && entryView === "ACTIVE" && !duplicatesOnly) {
    return null;
  }

  return {
    duplicatesOnly,
    entryType: entryType === "ALL" ? null : entryType,
    entryView,
    name,
    query,
    tagName
  };
}

function serializeSavedView(view: SavedView): SavedViewSummary {
  return {
    duplicatesOnly: view.duplicatesOnly,
    entryType: view.entryType || "ALL",
    entryView: normalizeEntryView(view.entryView),
    id: view.id,
    name: view.name,
    query: view.query || "",
    tagName: view.tagName || "",
    updatedAt: view.updatedAt.toISOString()
  };
}
