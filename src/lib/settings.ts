import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { trimTrailingSlash } from "@/lib/utils";

export type AppSettings = {
  appName: string;
  shareBaseUrl: string;
  storageDir: string;
};

const settingKeys = {
  appName: "app_name",
  shareBaseUrl: "share_base_url"
} as const;

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [settingKeys.appName, settingKeys.shareBaseUrl]
      }
    }
  });

  const settingsMap = new Map(rows.map((row) => [row.key, row.value]));

  return {
    appName: settingsMap.get(settingKeys.appName) || env.appName,
    shareBaseUrl: sanitizeBaseUrl(
      settingsMap.get(settingKeys.shareBaseUrl) || env.publicAppUrl
    ),
    storageDir: env.storageDir
  };
}

export async function saveSettings(input: {
  appName: string;
  shareBaseUrl: string;
}): Promise<AppSettings> {
  const appName = input.appName.trim() || env.appName;
  const shareBaseUrl = sanitizeBaseUrl(input.shareBaseUrl || env.publicAppUrl);

  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: settingKeys.appName },
      update: { value: appName },
      create: { key: settingKeys.appName, value: appName }
    }),
    prisma.appSetting.upsert({
      where: { key: settingKeys.shareBaseUrl },
      update: { value: shareBaseUrl },
      create: { key: settingKeys.shareBaseUrl, value: shareBaseUrl }
    })
  ]);

  return {
    appName,
    shareBaseUrl,
    storageDir: env.storageDir
  };
}

function sanitizeBaseUrl(value: string): string {
  const fallback = trimTrailingSlash(env.publicAppUrl);

  try {
    return trimTrailingSlash(new URL(value).toString());
  } catch {
    return fallback;
  }
}
