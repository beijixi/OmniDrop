import { AssetKind, EntryType } from "@prisma/client";

const imageExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);
const videoExtensions = new Set(["mp4", "mov", "m4v", "webm", "ogg"]);
const pdfExtensions = new Set(["pdf"]);

export const entryTypeOptions: Array<EntryType | "ALL"> = [
  "ALL",
  EntryType.TEXT,
  EntryType.IMAGE,
  EntryType.VIDEO,
  EntryType.PDF,
  EntryType.FILE,
  EntryType.MIXED
];

export const entryTypeLabels: Record<EntryType | "ALL", string> = {
  ALL: "全部",
  TEXT: "文本",
  IMAGE: "图片",
  VIDEO: "视频",
  PDF: "PDF",
  FILE: "文件",
  MIXED: "混合"
};

export function detectAssetKind(mimeType: string, fileName: string): AssetKind {
  const normalizedMime = mimeType.toLowerCase();
  const extension = getFileExtension(fileName);

  if (normalizedMime.startsWith("image/") || imageExtensions.has(extension)) {
    return AssetKind.IMAGE;
  }

  if (normalizedMime.startsWith("video/") || videoExtensions.has(extension)) {
    return AssetKind.VIDEO;
  }

  if (normalizedMime === "application/pdf" || pdfExtensions.has(extension)) {
    return AssetKind.PDF;
  }

  return AssetKind.FILE;
}

export function resolveEntryType(kinds: AssetKind[]): EntryType {
  if (kinds.length === 0) {
    return EntryType.TEXT;
  }

  const uniqueKinds = [...new Set(kinds)];

  if (uniqueKinds.length > 1) {
    return EntryType.MIXED;
  }

  switch (uniqueKinds[0]) {
    case AssetKind.IMAGE:
      return EntryType.IMAGE;
    case AssetKind.VIDEO:
      return EntryType.VIDEO;
    case AssetKind.PDF:
      return EntryType.PDF;
    default:
      return EntryType.FILE;
  }
}

export function getFileExtension(fileName: string): string {
  const extension = fileName.split(".").pop();
  return extension ? extension.toLowerCase() : "";
}

export function extensionFromMimeType(mimeType: string): string {
  const normalizedMime = mimeType.toLowerCase();

  if (normalizedMime === "image/jpeg") {
    return "jpg";
  }

  if (normalizedMime === "image/png") {
    return "png";
  }

  if (normalizedMime === "image/webp") {
    return "webp";
  }

  if (normalizedMime === "image/gif") {
    return "gif";
  }

  if (normalizedMime === "video/mp4") {
    return "mp4";
  }

  if (normalizedMime === "video/webm") {
    return "webm";
  }

  if (normalizedMime === "application/pdf") {
    return "pdf";
  }

  return "";
}
