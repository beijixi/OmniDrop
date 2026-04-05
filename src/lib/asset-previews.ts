import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";

import mammoth from "mammoth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { Asset, StorageDriver } from "@prisma/client";
import { marked } from "marked";
import * as XLSX from "xlsx";

import {
  buildWebDavFileUrl,
  getLocalStoredFilePath,
  getS3Bucket,
  getS3Client,
  getWebDavAuthHeaders
} from "@/lib/storage";
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

async function readAssetBuffer(asset: AssetPreviewSource): Promise<Buffer> {
  switch (asset.storageDriver) {
    case "S3":
      return readS3Asset(asset.relativePath);
    case "WEBDAV":
      return readWebDavAsset(asset.relativePath);
    default:
      return readFile(getLocalStoredFilePath(asset.relativePath));
  }
}

async function readS3Asset(relativePath: string) {
  const result = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: relativePath
    })
  );

  if (!result.Body) {
    throw new Error("EMPTY_S3_BODY");
  }

  return streamToBuffer(result.Body);
}

async function readWebDavAsset(relativePath: string) {
  const response = await fetch(buildWebDavFileUrl(relativePath), {
    headers: getWebDavAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`WEBDAV_READ_FAILED_${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (body && typeof body === "object" && "transformToByteArray" in body) {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }

  if (body && typeof body === "object" && "transformToWebStream" in body) {
    return webStreamToBuffer(
      (body as { transformToWebStream: () => ReadableStream<Uint8Array> }).transformToWebStream()
    );
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];

    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  if (body && typeof body === "object" && "getReader" in body) {
    return webStreamToBuffer(body as ReadableStream<Uint8Array>);
  }

  throw new Error("UNSUPPORTED_STREAM_BODY");
}

async function webStreamToBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (value) {
      chunks.push(value);
    }
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}
