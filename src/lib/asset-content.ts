import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { promisify } from "node:util";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { Asset, StorageDriver } from "@prisma/client";
import mammoth from "mammoth";
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

const MAX_SEARCH_INDEX_BYTES = 20 * 1024 * 1024;
const MAX_SEARCH_TEXT_CHARS = 50_000;
const MAX_PDF_PAGES = 40;
const MAX_SPREADSHEET_SHEETS = 3;
const MAX_SPREADSHEET_ROWS = 200;
const MAX_SPREADSHEET_COLUMNS = 20;
const MAX_OCR_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_OCR_PDF_PAGES = 8;
const MIN_DIRECT_PDF_TEXT_CHARS = 80;
const OCR_LANGUAGE_CANDIDATES = [...new Set(["chi_sim+eng", "eng"])];

const execFileAsync = promisify(execFile);

let pdfjsModulePromise: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | null = null;
let tesseractAvailablePromise: Promise<boolean> | null = null;
let pdftoppmAvailablePromise: Promise<boolean> | null = null;

export type StoredAssetSource = Pick<Asset, "relativePath" | "storageDriver"> & {
  storageDriver: StorageDriver;
};

export type AssetSearchTextSource = Pick<
  Asset,
  "kind" | "mimeType" | "originalName" | "relativePath" | "size"
> & {
  storageDriver: StorageDriver;
};

export async function extractAssetSearchText(
  asset: AssetSearchTextSource
): Promise<string | null> {
  if (asset.size <= 0 || asset.size > MAX_SEARCH_INDEX_BYTES) {
    return null;
  }

  const buffer = await readAssetBuffer(asset).catch(() => null);

  if (!buffer || buffer.byteLength === 0) {
    return null;
  }

  if (asset.kind === "PDF") {
    return extractPdfSearchText(buffer);
  }

  if (asset.kind === "IMAGE") {
    if (asset.size > MAX_OCR_IMAGE_BYTES) {
      return null;
    }

    return extractImageOcrText(buffer, getImageExtension(asset.originalName));
  }

  if (asset.kind !== "FILE") {
    return null;
  }

  const extension = getFileExtension(asset.originalName);

  if (isWordFile(asset.mimeType, asset.originalName) && extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeSearchText(result.value);
  }

  if (isSpreadsheetFile(asset.mimeType, asset.originalName)) {
    return extractSpreadsheetSearchText(buffer);
  }

  if (isMarkdownFile(asset.mimeType, asset.originalName) || isPreviewableTextFile(asset.mimeType, asset.originalName)) {
    return normalizeSearchText(decodeText(buffer));
  }

  return null;
}

export async function readAssetBuffer(asset: StoredAssetSource): Promise<Buffer> {
  switch (asset.storageDriver) {
    case "S3":
      return readS3Asset(asset.relativePath);
    case "WEBDAV":
      return readWebDavAsset(asset.relativePath);
    default:
      return readFile(getLocalStoredFilePath(asset.relativePath));
  }
}

function decodeText(buffer: Buffer) {
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

function normalizeSearchText(value: string): string | null {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_SEARCH_TEXT_CHARS);
}

async function extractPdfSearchText(buffer: Buffer) {
  const { getDocument } = await loadPdfJs();
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true
  });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];
  let accumulatedLength = 0;

  try {
    const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (!pageText) {
        continue;
      }

      parts.push(pageText);
      accumulatedLength += pageText.length + 1;

      if (accumulatedLength >= MAX_SEARCH_TEXT_CHARS) {
        break;
      }
    }
  } finally {
    await pdf.destroy();
  }

  const directText = normalizeSearchText(parts.join("\n"));

  if (directText && directText.length >= MIN_DIRECT_PDF_TEXT_CHARS) {
    return directText;
  }

  const ocrText = await extractPdfOcrText(buffer);
  return mergeSearchText(directText, ocrText);
}

function extractSpreadsheetSearchText(buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    dense: true,
    type: "buffer"
  });
  const parts: string[] = [];
  let accumulatedLength = 0;

  for (const sheetName of workbook.SheetNames.slice(0, MAX_SPREADSHEET_SHEETS)) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      blankrows: false,
      defval: "",
      header: 1,
      raw: false
    });

    if (rows.length === 0) {
      continue;
    }

    parts.push(sheetName);
    accumulatedLength += sheetName.length + 1;

    for (const row of rows.slice(0, MAX_SPREADSHEET_ROWS)) {
      const line = row
        .slice(0, MAX_SPREADSHEET_COLUMNS)
        .map((cell) => String(cell ?? "").trim())
        .filter(Boolean)
        .join("\t");

      if (!line) {
        continue;
      }

      parts.push(line);
      accumulatedLength += line.length + 1;

      if (accumulatedLength >= MAX_SEARCH_TEXT_CHARS) {
        return normalizeSearchText(parts.join("\n"));
      }
    }
  }

  return normalizeSearchText(parts.join("\n"));
}

async function loadPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }

  return pdfjsModulePromise;
}

async function extractImageOcrText(buffer: Buffer, extension: string) {
  if (!(await hasTesseract())) {
    return null;
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "omnidrop-image-ocr-"));
  const filePath = path.join(tempDir, `input.${extension}`);

  try {
    await writeFile(filePath, buffer);
    return runTesseract(filePath);
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

async function extractPdfOcrText(buffer: Buffer) {
  if (!(await hasTesseract()) || !(await hasPdftoppm())) {
    return null;
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "omnidrop-pdf-ocr-"));
  const pdfPath = path.join(tempDir, "input.pdf");
  const outputPrefix = path.join(tempDir, "page");

  try {
    await writeFile(pdfPath, buffer);
    await execFileAsync(
      "pdftoppm",
      ["-f", "1", "-l", String(MAX_OCR_PDF_PAGES), "-png", pdfPath, outputPrefix],
      {
        maxBuffer: 16 * 1024 * 1024,
        timeout: 120_000
      }
    );

    const files = (await readdir(tempDir))
      .filter((file) => file.startsWith("page-") && file.endsWith(".png"))
      .sort();
    const parts: string[] = [];

    for (const file of files) {
      const text = await runTesseract(path.join(tempDir, file));

      if (text) {
        parts.push(text);
      }

      if (parts.join("\n").length >= MAX_SEARCH_TEXT_CHARS) {
        break;
      }
    }

    return normalizeSearchText(parts.join("\n"));
  } catch {
    return null;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

async function runTesseract(filePath: string) {
  for (const languages of OCR_LANGUAGE_CANDIDATES) {
    try {
      const { stdout } = await execFileAsync(
        "tesseract",
        [filePath, "stdout", "-l", languages, "--psm", "3", "--oem", "1", "quiet"],
        {
          maxBuffer: 16 * 1024 * 1024,
          timeout: 120_000
        }
      );

      const normalized = normalizeSearchText(stdout);

      if (normalized) {
        return normalized;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function hasTesseract() {
  if (!tesseractAvailablePromise) {
    tesseractAvailablePromise = isCommandAvailable("tesseract", ["--version"]);
  }

  return tesseractAvailablePromise;
}

async function hasPdftoppm() {
  if (!pdftoppmAvailablePromise) {
    pdftoppmAvailablePromise = isCommandAvailable("pdftoppm", ["-v"]);
  }

  return pdftoppmAvailablePromise;
}

async function isCommandAvailable(command: string, args: string[]) {
  try {
    await execFileAsync(command, args, {
      maxBuffer: 1024 * 1024,
      timeout: 15_000
    });
    return true;
  } catch {
    return false;
  }
}

function getImageExtension(fileName: string) {
  const extension = getFileExtension(fileName);

  if (extension) {
    return extension;
  }

  return "png";
}

function mergeSearchText(...parts: Array<string | null>) {
  const unique = [...new Set(parts.filter(Boolean))];
  return normalizeSearchText(unique.join("\n\n"));
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
    const bytes = await (
      body as { transformToByteArray: () => Promise<Uint8Array> }
    ).transformToByteArray();
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
