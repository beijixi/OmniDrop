import { AssetKind, EntryType } from "@prisma/client";

import { getEntryTypeLabels as getLocalizedEntryTypeLabels, type AppLocale } from "@/lib/i18n";

const imageExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);
const videoExtensions = new Set(["mp4", "mov", "m4v", "webm", "ogg"]);
const pdfExtensions = new Set(["pdf"]);
const markdownExtensions = new Set(["md", "markdown", "mdx"]);
const spreadsheetExtensions = new Set(["xlsx", "xls", "csv", "tsv", "ods"]);
const wordExtensions = new Set(["docx", "doc", "odt", "pages"]);
const presentationExtensions = new Set(["ppt", "pptx", "key", "odp"]);
const archiveExtensions = new Set(["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz"]);
const audioExtensions = new Set(["mp3", "wav", "flac", "aac", "m4a", "oga", "ogg"]);
const codeExtensions = new Set([
  "txt",
  "json",
  "yaml",
  "yml",
  "toml",
  "ini",
  "env",
  "xml",
  "html",
  "css",
  "scss",
  "less",
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "sh",
  "bash",
  "zsh",
  "sql",
  "log",
  "conf",
  "cfg"
]);
const designExtensions = new Set(["fig", "sketch", "psd", "ai", "xd"]);
const appExtensions = new Set(["apk", "ipa", "dmg", "pkg", "exe", "msi", "appimage"]);

export type FileVisual = {
  badge: string;
  label: string;
  tone:
    | "slate"
    | "blue"
    | "green"
    | "amber"
    | "rose"
    | "violet"
    | "cyan";
};

export const entryTypeOptions: Array<EntryType | "ALL"> = [
  "ALL",
  EntryType.TEXT,
  EntryType.IMAGE,
  EntryType.VIDEO,
  EntryType.PDF,
  EntryType.FILE,
  EntryType.MIXED
];

export function getEntryTypeLabels(locale: AppLocale) {
  return getLocalizedEntryTypeLabels(locale);
}

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

export function isMarkdownFile(mimeType: string, fileName: string): boolean {
  const normalizedMime = mimeType.toLowerCase();
  const extension = getFileExtension(fileName);

  return normalizedMime.includes("markdown") || markdownExtensions.has(extension);
}

export function isSpreadsheetFile(mimeType: string, fileName: string): boolean {
  const normalizedMime = mimeType.toLowerCase();
  const extension = getFileExtension(fileName);

  return (
    normalizedMime.includes("spreadsheet") ||
    normalizedMime.includes("excel") ||
    normalizedMime.includes("csv") ||
    spreadsheetExtensions.has(extension)
  );
}

export function isWordFile(mimeType: string, fileName: string): boolean {
  const normalizedMime = mimeType.toLowerCase();
  const extension = getFileExtension(fileName);

  return (
    normalizedMime.includes("word") ||
    normalizedMime.includes("officedocument.wordprocessingml") ||
    wordExtensions.has(extension)
  );
}

export function isPreviewableTextFile(mimeType: string, fileName: string): boolean {
  const normalizedMime = mimeType.toLowerCase();
  const extension = getFileExtension(fileName);

  return (
    normalizedMime.startsWith("text/") ||
    normalizedMime.includes("json") ||
    normalizedMime.includes("xml") ||
    normalizedMime.includes("yaml") ||
    normalizedMime.includes("javascript") ||
    normalizedMime.includes("typescript") ||
    normalizedMime.includes("shellscript") ||
    markdownExtensions.has(extension) ||
    codeExtensions.has(extension)
  );
}

export function getFileVisual(fileName: string, mimeType: string): FileVisual {
  const extension = getFileExtension(fileName);
  const upperExtension = extension ? extension.toUpperCase() : "FILE";

  if (isWordFile(mimeType, fileName)) {
    return {
      badge: "W",
      label: extension === "docx" || extension === "doc" ? upperExtension : "WORD",
      tone: "blue"
    };
  }

  if (isSpreadsheetFile(mimeType, fileName)) {
    return {
      badge: "X",
      label: extension ? upperExtension : "SHEET",
      tone: "green"
    };
  }

  if (presentationExtensions.has(extension) || mimeType.toLowerCase().includes("presentation")) {
    return {
      badge: "P",
      label: extension ? upperExtension : "SLIDE",
      tone: "amber"
    };
  }

  if (isMarkdownFile(mimeType, fileName)) {
    return {
      badge: "MD",
      label: upperExtension,
      tone: "slate"
    };
  }

  if (archiveExtensions.has(extension)) {
    return {
      badge: "ZIP",
      label: upperExtension,
      tone: "amber"
    };
  }

  if (audioExtensions.has(extension) || mimeType.toLowerCase().startsWith("audio/")) {
    return {
      badge: "A",
      label: extension ? upperExtension : "AUDIO",
      tone: "rose"
    };
  }

  if (designExtensions.has(extension)) {
    return {
      badge: extension === "fig" ? "F" : upperExtension.slice(0, 2),
      label: upperExtension,
      tone: "violet"
    };
  }

  if (appExtensions.has(extension)) {
    return {
      badge: "APP",
      label: upperExtension,
      tone: "violet"
    };
  }

  if (isPreviewableTextFile(mimeType, fileName)) {
    return {
      badge: codeExtensions.has(extension) ? "</>" : "TXT",
      label: upperExtension,
      tone: "cyan"
    };
  }

  return {
    badge: extension ? upperExtension.slice(0, 4) : "FILE",
    label: upperExtension,
    tone: "slate"
  };
}
