import { backfillLinkPreviews } from "../src/lib/link-preview";
import { prisma } from "../src/lib/prisma";

type CliOptions = {
  batchSize?: number;
  force?: boolean;
  limit?: number;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await backfillLinkPreviews(options);

  console.log(
    `Backfill completed. Indexed ${result.indexed} links${result.failed > 0 ? `, ${result.failed} failed` : ""}.`
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (const arg of argv) {
    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      const value = Number.parseInt(arg.split("=")[1] || "", 10);

      if (!Number.isNaN(value) && value > 0) {
        options.batchSize = value;
      }

      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number.parseInt(arg.split("=")[1] || "", 10);

      if (!Number.isNaN(value) && value > 0) {
        options.limit = value;
      }
    }
  }

  return options;
}

main()
  .catch((error) => {
    console.error("Backfill failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
