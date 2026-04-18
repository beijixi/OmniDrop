import mammoth from "mammoth";
import type { Asset, StorageDriver } from "@prisma/client";
import { marked } from "marked";
import * as XLSX from "xlsx";

import { readAssetBuffer } from "@/lib/asset-content";
import {
  getFileExtension,
  isMarkdownFile,
  isPreviewableTextFile,
  isSpreadsheetFile,
  isWordFile
} from "@/lib/file-types";

const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_LINES = 28;
const MAX_TEXT_CHARS = 6000;
const MAX_TABLE_ROWS = 8;
const MAX_TABLE_COLUMNS = 6;

type AssetPreviewSource = Pick<Asset, "kind" | "mimeType" | "originalName" | "relativePath" | "size"> & {
  storageDriver: StorageDriver;
};

export type AssetPreview =
  | {
      kind: "markdown";
      html: string;
      truncated: boolean;
    }
  | {
      kind: "text";
      text: string;
      truncated: boolean;
    }
  | {
      kind: "table";
      columns: string[];
      rows: string[][];
      sheetName: string | null;
      truncated: boolean;
    };

export async function getAssetPreview(asset: AssetPreviewSource): Promise<AssetPreview | null> {
  if (asset.kind !== "FILE" || asset.size <= 0 || asset.size > MAX_PREVIEW_BYTES) {
    return null;
  }

  const extension = getFileExtension(asset.originalName);
  const buffer = await readAssetBuffer(asset).catch(() => null);

  if (!buffer || buffer.byteLength === 0) {
    return null;
  }

  if (isMarkdownFile(asset.mimeType, asset.originalName)) {
    const raw = decodeText(buffer);
    const trimmed = trimTextPreview(raw);

    return {
      html: marked.parse(escapeHtml(trimmed.text), {
        breaks: true,
        gfm: true
      }) as string,
      kind: "markdown",
      truncated: trimmed.truncated
    };
  }

  if (isWordFile(asset.mimeType, asset.originalName) && extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    const trimmed = trimTextPreview(result.value);

    return {
      kind: "text",
      text: trimmed.text,
      truncated: trimmed.truncated
    };
  }

  if (isSpreadsheetFile(asset.mimeType, asset.originalName)) {
    const workbook = XLSX.read(buffer, {
      dense: true,
      type: "buffer"
    });
    const firstSheetName = workbook.SheetNames[0] || null;

    if (!firstSheetName) {
      return null;
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      blankrows: false,
      defval: "",
      header: 1,
      raw: false
    });

    if (rows.length === 0) {
      return null;
    }

    const normalizedRows = rows
      .slice(0, MAX_TABLE_ROWS + 1)
      .map((row) =>
        row.slice(0, MAX_TABLE_COLUMNS).map((cell) => String(cell ?? "").trim())
      );
    const [headerRow, ...bodyRows] = normalizedRows;
    const fallbackColumns = headerRow.map((value, index) => value || columnName(index));

    return {
      columns: fallbackColumns,
      kind: "table",
      rows: bodyRows,
      sheetName: firstSheetName,
      truncated: rows.length > MAX_TABLE_ROWS + 1 || headerRow.length > MAX_TABLE_COLUMNS
    };
  }

  if (isPreviewableTextFile(asset.mimeType, asset.originalName)) {
    const raw = decodeText(buffer);
    const trimmed = trimTextPreview(raw);

    return {
      kind: "text",
      text: trimmed.text,
      truncated: trimmed.truncated
    };
  }

  return null;
}

function decodeText(buffer: Buffer) {
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

function trimTextPreview(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  const sliced = normalized.slice(0, MAX_TEXT_CHARS);
  const lines = sliced.split("\n").slice(0, MAX_TEXT_LINES);
  const text = lines.join("\n");

  return {
    text,
    truncated: normalized.length > text.length || normalized.split("\n").length > lines.length
  };
}

function columnName(index: number) {
  let value = index + 1;
  let label = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }

  return label;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
