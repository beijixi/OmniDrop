import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AssetKind } from "@prisma/client";

import { env } from "@/lib/env";
import { detectAssetKind, extensionFromMimeType, getFileExtension } from "@/lib/file-types";

export type SavedUpload = {
  absolutePath: string;
  kind: AssetKind;
  mimeType: string;
  originalName: string;
  relativePath: string;
  size: number;
  storedName: string;
};

export const storageRoot = path.isAbsolute(env.storageDir)
  ? env.storageDir
  : path.resolve(process.cwd(), env.storageDir);

export async function ensureStorageDir(): Promise<void> {
  await mkdir(storageRoot, { recursive: true });
}

export async function saveIncomingFiles(files: File[]): Promise<SavedUpload[]> {
  await ensureStorageDir();

  const now = new Date();
  const segment = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const targetDir = path.join(storageRoot, segment);

  await mkdir(targetDir, { recursive: true });

  const savedUploads: SavedUpload[] = [];

  for (const file of files) {
    const originalName = file.name || "upload";
    const extension =
      getFileExtension(originalName) || extensionFromMimeType(file.type) || "bin";
    const storedName = `${randomUUID()}.${extension}`;
    const relativePath = path.posix.join(segment, storedName);
    const absolutePath = path.join(storageRoot, relativePath);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(absolutePath, buffer);

    savedUploads.push({
      absolutePath,
      kind: detectAssetKind(file.type || "", originalName),
      mimeType: file.type || "application/octet-stream",
      originalName,
      relativePath,
      size: buffer.byteLength,
      storedName
    });
  }

  return savedUploads;
}

export async function removeStoredFiles(files: SavedUpload[]): Promise<void> {
  await Promise.all(files.map((file) => rm(file.absolutePath, { force: true })));
}

export async function removeStoredRelativePaths(paths: string[]): Promise<void> {
  await Promise.allSettled(
    paths.map((relativePath) => rm(getStoredFilePath(relativePath), { force: true }))
  );
}

export function getStoredFilePath(relativePath: string): string {
  return path.join(storageRoot, relativePath);
}
