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
    isFavorite: entry.isFavorite,
    archivedAt: entry.archivedAt?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    sender: {
      host: entry.senderHost,
      ip: entry.senderIp,
      name: entry.senderName
    },
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
