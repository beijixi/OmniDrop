import { buildContentHash, buildMessageFingerprint, extractCanonicalUrlFromMessage } from "@/lib/dedupe";
import { prisma } from "@/lib/prisma";
import { readStoredAssetBuffer } from "@/lib/storage";

const DEFAULT_BATCH_SIZE = 25;

async function main() {
  const batchSize = resolveBatchSize(process.argv.slice(2));
  let entryBackfilled = 0;
  let assetBackfilled = 0;

  while (true) {
    const entries = await prisma.entry.findMany({
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        message: true
      },
      take: batchSize,
      where: {
        message: {
          not: null
        },
        messageFingerprint: null
      }
    });

    if (entries.length === 0) {
      break;
    }

    for (const entry of entries) {
      const fingerprint = buildMessageFingerprint(entry.message);

      if (!fingerprint) {
        continue;
      }

      await prisma.entry.update({
        data: {
          canonicalUrl: extractCanonicalUrlFromMessage(entry.message),
          messageFingerprint: fingerprint
        },
        where: {
          id: entry.id
        }
      });

      entryBackfilled += 1;
    }
  }

  while (true) {
    const assets = await prisma.asset.findMany({
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        relativePath: true,
        storageDriver: true
      },
      take: batchSize,
      where: {
        contentHash: null
      }
    });

    if (assets.length === 0) {
      break;
    }

    for (const asset of assets) {
      const buffer = await readStoredAssetBuffer(asset);

      await prisma.asset.update({
        data: {
          contentHash: buildContentHash(buffer)
        },
        where: {
          id: asset.id
        }
      });

      assetBackfilled += 1;
    }
  }

  console.log(`Backfilled dedupe metadata for ${entryBackfilled} entries and ${assetBackfilled} assets.`);
}

function resolveBatchSize(args: string[]) {
  const match = args.find((item) => item.startsWith("--batch-size="));

  if (!match) {
    return DEFAULT_BATCH_SIZE;
  }

  const parsed = Number.parseInt(match.split("=")[1] || "", 10);

  if (!parsed || Number.isNaN(parsed)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(200, parsed));
}

main()
  .catch((error) => {
    console.error("Failed to backfill dedupe metadata", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
