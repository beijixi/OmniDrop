import type { Asset, AssetKind } from "@prisma/client";

import { extractAssetSearchText } from "@/lib/asset-content";
import { prisma } from "@/lib/prisma";
import type { EntryWithRelations } from "@/lib/entries";

type IndexAssetsOptions = {
  force?: boolean;
};

type BackfillAssetSearchTextOptions = {
  batchSize?: number;
  force?: boolean;
  kinds?: AssetKind[];
  limit?: number;
};

export async function indexEntryAssetsSearchText(
  entries: Array<Pick<EntryWithRelations, "assets">>,
  options: IndexAssetsOptions = {}
) {
  return indexAssetsSearchText(
    entries.flatMap((entry) => entry.assets),
    options
  );
}

export async function indexAssetsSearchText(
  assets: Asset[],
  options: IndexAssetsOptions = {}
) {
  let indexed = 0;
  let failed = 0;

  for (const asset of assets) {
    if (!options.force && asset.searchTextIndexedAt) {
      continue;
    }

    let searchText: string | null = null;

    try {
      searchText = await extractAssetSearchText(asset);
    } catch (error) {
      failed += 1;
      console.error(`Failed to index asset ${asset.id}`, error);
    }

    await prisma.asset.update({
      where: {
        id: asset.id
      },
      data: {
        searchText,
        searchTextIndexedAt: new Date()
      }
    });

    indexed += 1;
  }

  return {
    failed,
    indexed
  };
}

export async function backfillAssetSearchText(
  options: BackfillAssetSearchTextOptions = {}
) {
  const batchSize = Math.max(1, Math.min(options.batchSize ?? 10, 100));
  const limit = options.limit && options.limit > 0 ? options.limit : Infinity;
  const baseWhere = {
    ...(options.force ? {} : { searchTextIndexedAt: null }),
    ...(options.kinds?.length ? { kind: { in: options.kinds } } : {})
  };

  let cursorId: string | undefined;
  let indexed = 0;
  let failed = 0;

  while (indexed < limit) {
    const remaining = Number.isFinite(limit) ? Math.min(batchSize, limit - indexed) : batchSize;
    const assets = await prisma.asset.findMany({
      where: {
        ...baseWhere,
        ...(cursorId
          ? {
              id: {
                gt: cursorId
              }
            }
          : {})
      },
      orderBy: {
        id: "asc"
      },
      take: remaining
    });

    if (assets.length === 0) {
      break;
    }

    const result = await indexAssetsSearchText(assets, {
      force: true
    });

    indexed += result.indexed;
    failed += result.failed;
    cursorId = assets[assets.length - 1]?.id;
  }

  return {
    failed,
    indexed
  };
}
