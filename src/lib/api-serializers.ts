import type { CollectionSummary, CollectionWithEntries } from "@/lib/collections";
import type { AppSettings } from "@/lib/settings";
import type { EntryWithRelations } from "@/lib/entries";

import { trimTrailingSlash } from "@/lib/utils";

export function serializeSettings(settings: AppSettings) {
  return {
    appName: settings.appName,
    shareBaseUrl: settings.shareBaseUrl,
    internalShareBaseUrl: settings.internalShareBaseUrl
  };
}

export function serializeEntry(
  entry: EntryWithRelations,
  input: {
    assetBasePath?: string;
    shareBaseUrl: string;
  }
) {
  const assetBasePath = trimTrailingSlash(input.assetBasePath || "/api/v1/assets");
  const share =
    entry.shareLink
      ? {
          revokedAt: entry.shareLink.revokedAt?.toISOString() || null,
          token: entry.shareLink.token,
          url: entry.shareLink.revokedAt
            ? null
            : `${trimTrailingSlash(input.shareBaseUrl)}/share/${entry.shareLink.token}`
        }
      : null;

  return {
    id: entry.id,
    type: entry.type,
    message: entry.message,
    note: entry.note,
    linkPreview: entry.canonicalUrl
      ? {
          contentText: entry.linkContentText,
          description: entry.linkDescription,
          error: entry.linkFetchError,
          fetchedAt: entry.linkFetchedAt?.toISOString() || null,
          imageUrl: entry.linkImageUrl,
          publishedAt: entry.linkPublishedAt?.toISOString() || null,
          requestedAt: entry.linkFetchRequestedAt?.toISOString() || null,
          siteName: entry.linkSiteName,
          status: entry.linkFetchStatus,
          title: entry.linkTitle,
          url: entry.canonicalUrl
        }
      : null,
    isFavorite: entry.isFavorite,
    readingState: entry.readingState,
    archivedAt: entry.archivedAt?.toISOString() || null,
    pinnedAt: entry.pinnedAt?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    sender: {
      host: entry.senderHost,
      ip: entry.senderIp,
      name: entry.senderName
    },
    excerpts: entry.excerpts.map((excerpt) => ({
      assetId: excerpt.assetId,
      assetName: excerpt.asset?.originalName || null,
      content: excerpt.content,
      createdAt: excerpt.createdAt.toISOString(),
      id: excerpt.id,
      note: excerpt.note,
      source: excerpt.source,
      updatedAt: excerpt.updatedAt.toISOString()
    })),
    tags: entry.tags.map((item) => item.tag.name),
    assets: entry.assets.map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      mimeType: asset.mimeType,
      originalName: asset.originalName,
      size: asset.size,
      storageDriver: asset.storageDriver,
      url: `${assetBasePath}/${asset.id}`
    })),
    share
  };
}

export function serializeCollectionSummary(
  collection: CollectionSummary,
  _input?: {
    shareBaseUrl?: string;
  }
) {
  return {
    description: collection.description,
    entryCount: collection.entryCount,
    hasActiveShare: collection.hasActiveShare,
    id: collection.id,
    title: collection.title,
    updatedAt: collection.updatedAt,
    url: `/collections/${collection.id}`
  };
}

export function serializeCollection(
  collection: CollectionWithEntries,
  input: {
    assetBasePath?: string;
    shareBaseUrl: string;
  }
) {
  const share =
    collection.shareLink
      ? {
          revokedAt: collection.shareLink.revokedAt?.toISOString() || null,
          token: collection.shareLink.token,
          url: collection.shareLink.revokedAt
            ? null
            : `${trimTrailingSlash(input.shareBaseUrl)}/share/collections/${collection.shareLink.token}`
        }
      : null;

  return {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    share,
    entries: collection.entries.map((item) => ({
      createdAt: item.createdAt.toISOString(),
      entry: serializeEntry(item.entry, input),
      entryId: item.entryId,
      position: item.position
    }))
  };
}
