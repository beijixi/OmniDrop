import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { trimTrailingSlash } from "@/lib/utils";

export type AppSettings = {
  appName: string;
  shareBaseUrl: string;
  internalShareBaseUrl: string;
};

const settingKeys = {
  appName: "app_name",
  shareBaseUrl: "share_base_url",
  internalShareBaseUrl: "share_internal_base_url"
} as const;

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [settingKeys.appName, settingKeys.shareBaseUrl, settingKeys.internalShareBaseUrl]
      }
    }
  });

  const settingsMap = new Map(rows.map((row) => [row.key, row.value]));

  return {
    appName: settingsMap.get(settingKeys.appName) || env.appName,
    shareBaseUrl: sanitizeBaseUrl(settingsMap.get(settingKeys.shareBaseUrl) || env.publicAppUrl),
    internalShareBaseUrl: sanitizeOptionalBaseUrl(
      settingsMap.get(settingKeys.internalShareBaseUrl) || env.internalAppUrl
    )
  };
}

export async function saveSettings(input: {
  appName?: string;
  shareBaseUrl: string;
  internalShareBaseUrl?: string;
}): Promise<AppSettings> {
  const currentSettings = await getSettings();
  const appName = input.appName?.trim() || currentSettings.appName || env.appName;
  const shareBaseUrl = sanitizeBaseUrl(input.shareBaseUrl || env.publicAppUrl);
  const internalShareBaseUrl = sanitizeOptionalBaseUrl(
    input.internalShareBaseUrl ?? currentSettings.internalShareBaseUrl ?? env.internalAppUrl
  );

  const operations = [
    prisma.appSetting.upsert({
      where: { key: settingKeys.shareBaseUrl },
      update: { value: shareBaseUrl },
      create: { key: settingKeys.shareBaseUrl, value: shareBaseUrl }
    })
  ];

  if (input.internalShareBaseUrl !== undefined) {
    operations.push(
      prisma.appSetting.upsert({
        where: { key: settingKeys.internalShareBaseUrl },
        update: { value: internalShareBaseUrl },
        create: { key: settingKeys.internalShareBaseUrl, value: internalShareBaseUrl }
      })
    );
  }

  if (input.appName !== undefined) {
    operations.unshift(
      prisma.appSetting.upsert({
        where: { key: settingKeys.appName },
        update: { value: appName },
        create: { key: settingKeys.appName, value: appName }
      })
    );
  }

  await prisma.$transaction(operations);

  return {
    appName,
    shareBaseUrl,
    internalShareBaseUrl
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

function sanitizeOptionalBaseUrl(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "";
  }

  try {
    return trimTrailingSlash(new URL(value).toString());
  } catch {
    return "";
  }
}
