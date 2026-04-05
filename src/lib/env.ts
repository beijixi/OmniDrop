import { resolveLocale, type AppLocale } from "@/lib/i18n";

export const env = {
  appName: process.env.APP_NAME?.trim() || "OmniDrop",
  defaultLocale: resolveLocale(process.env.DEFAULT_LOCALE) as AppLocale,
  publicAppUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
  internalAppUrl: process.env.INTERNAL_APP_URL?.trim() || "",
  storage: {
    driver: resolveStorageDriver(process.env.STORAGE_DRIVER),
    localDir: process.env.STORAGE_DIR?.trim() || "./storage/uploads",
    s3: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID?.trim() || "",
      bucket: process.env.S3_BUCKET?.trim() || "",
      endpoint: process.env.S3_ENDPOINT?.trim() || "",
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE?.trim() === "true",
      region: process.env.S3_REGION?.trim() || "auto",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY?.trim() || ""
    },
    webdav: {
      baseUrl: process.env.WEBDAV_BASE_URL?.trim() || "",
      password: process.env.WEBDAV_PASSWORD?.trim() || "",
      root: trimLeadingSlash(process.env.WEBDAV_ROOT?.trim() || "omnidrop"),
      username: process.env.WEBDAV_USERNAME?.trim() || ""
    }
  }
};

function resolveStorageDriver(value: string | undefined): "local" | "s3" | "webdav" {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "s3" || normalized === "webdav") {
    return normalized;
  }

  return "local";
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}
