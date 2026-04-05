import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { AssetKind } from "@prisma/client";
import { StorageDriver } from "@prisma/client";

import { env } from "@/lib/env";
import { detectAssetKind, extensionFromMimeType, getFileExtension } from "@/lib/file-types";

export type SavedUpload = {
  kind: AssetKind;
  mimeType: string;
  originalName: string;
  relativePath: string;
  size: number;
  storageDriver: StorageDriver;
  storedName: string;
};

export type StoredAssetTarget = Pick<SavedUpload, "relativePath" | "storageDriver">;

export const localStorageRoot = path.isAbsolute(env.storage.localDir)
  ? env.storage.localDir
  : path.resolve(process.cwd(), env.storage.localDir);

let cachedS3Client: S3Client | null = null;

export async function ensureStorageDir(): Promise<void> {
  await mkdir(localStorageRoot, { recursive: true });
}

export async function saveIncomingFiles(files: File[]): Promise<SavedUpload[]> {
  const now = new Date();
  const savedUploads: SavedUpload[] = [];

  try {
    for (const file of files) {
      const upload = await saveIncomingFile(file, now);
      savedUploads.push(upload);
    }
  } catch (error) {
    if (savedUploads.length > 0) {
      await removeStoredFiles(savedUploads);
    }

    throw error;
  }

  return savedUploads;
}

export async function removeStoredFiles(files: SavedUpload[]): Promise<void> {
  await Promise.allSettled(files.map((file) => removeStoredAsset(file)));
}

export async function removeStoredAssets(assets: StoredAssetTarget[]): Promise<void> {
  await Promise.allSettled(assets.map((asset) => removeStoredAsset(asset)));
}

export function getLocalStoredFilePath(relativePath: string): string {
  return path.join(localStorageRoot, relativePath);
}

export function getConfiguredStorageDriver(): StorageDriver {
  switch (env.storage.driver) {
    case "s3":
      return StorageDriver.S3;
    case "webdav":
      return StorageDriver.WEBDAV;
    default:
      return StorageDriver.LOCAL;
  }
}

export function getS3Client() {
  assertS3Configured();

  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      credentials: {
        accessKeyId: env.storage.s3.accessKeyId,
        secretAccessKey: env.storage.s3.secretAccessKey
      },
      endpoint: env.storage.s3.endpoint || undefined,
      forcePathStyle: env.storage.s3.forcePathStyle,
      region: env.storage.s3.region
    });
  }

  return cachedS3Client;
}

export function getS3Bucket() {
  assertS3Configured();
  return env.storage.s3.bucket;
}

export function buildWebDavFileUrl(relativePath: string) {
  assertWebDavConfigured();
  return buildWebDavUrl(relativePath);
}

export function getWebDavAuthHeaders() {
  assertWebDavConfigured();

  const token = Buffer.from(
    `${env.storage.webdav.username}:${env.storage.webdav.password}`,
    "utf8"
  ).toString("base64");

  return {
    Authorization: `Basic ${token}`
  };
}

async function saveIncomingFile(file: File, now: Date): Promise<SavedUpload> {
  const originalName = file.name || "upload";
  const extension = getFileExtension(originalName) || extensionFromMimeType(file.type) || "bin";
  const storedName = `${randomUUID()}.${extension}`;
  const segment = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const relativePath = path.posix.join(segment, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageDriver = getConfiguredStorageDriver();

  switch (storageDriver) {
    case StorageDriver.S3:
      await uploadToS3(relativePath, buffer, file.type || "application/octet-stream");
      break;
    case StorageDriver.WEBDAV:
      await uploadToWebDav(relativePath, buffer, file.type || "application/octet-stream");
      break;
    default:
      await saveToLocal(relativePath, buffer);
      break;
  }

  return {
    kind: detectAssetKind(file.type || "", originalName),
    mimeType: file.type || "application/octet-stream",
    originalName,
    relativePath,
    size: buffer.byteLength,
    storageDriver,
    storedName
  };
}

async function saveToLocal(relativePath: string, buffer: Buffer) {
  await ensureStorageDir();

  const targetDir = path.dirname(getLocalStoredFilePath(relativePath));
  await mkdir(targetDir, { recursive: true });
  await writeFile(getLocalStoredFilePath(relativePath), buffer);
}

async function uploadToS3(relativePath: string, buffer: Buffer, mimeType: string) {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Body: buffer,
      Bucket: getS3Bucket(),
      ContentType: mimeType,
      Key: relativePath
    })
  );
}

async function uploadToWebDav(relativePath: string, buffer: Buffer, mimeType: string) {
  await ensureWebDavCollections(path.posix.dirname(relativePath));

  const response = await fetch(buildWebDavUrl(relativePath), {
    body: new Uint8Array(buffer),
    headers: {
      ...getWebDavAuthHeaders(),
      "Content-Type": mimeType
    },
    method: "PUT"
  });

  if (!response.ok) {
    throw new Error(`WEBDAV_UPLOAD_FAILED_${response.status}`);
  }
}

async function ensureWebDavCollections(relativeDirectory: string) {
  assertWebDavConfigured();

  const cleanDirectory = relativeDirectory.replace(/^\/+/, "").replace(/\/+$/, "");

  if (!cleanDirectory || cleanDirectory === ".") {
    return;
  }

  const segments = [
    ...env.storage.webdav.root.split("/").filter(Boolean),
    ...cleanDirectory.split("/").filter(Boolean)
  ];

  let currentPath = "";

  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;

    const response = await fetch(buildWebDavUrl(currentPath), {
      headers: getWebDavAuthHeaders(),
      method: "MKCOL"
    });

    if (
      response.ok ||
      response.status === 301 ||
      response.status === 302 ||
      response.status === 405
    ) {
      continue;
    }

    throw new Error(`WEBDAV_MKCOL_FAILED_${response.status}`);
  }
}

async function removeStoredAsset(asset: StoredAssetTarget) {
  switch (asset.storageDriver) {
    case StorageDriver.S3:
      await removeFromS3(asset.relativePath);
      return;
    case StorageDriver.WEBDAV:
      await removeFromWebDav(asset.relativePath);
      return;
    default:
      await rm(getLocalStoredFilePath(asset.relativePath), { force: true });
  }
}

async function removeFromS3(relativePath: string) {
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: getS3Bucket(),
      Key: relativePath
    })
  );
}

async function removeFromWebDav(relativePath: string) {
  const response = await fetch(buildWebDavUrl(relativePath), {
    headers: getWebDavAuthHeaders(),
    method: "DELETE"
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`WEBDAV_DELETE_FAILED_${response.status}`);
  }
}

function assertS3Configured() {
  if (
    !env.storage.s3.bucket ||
    !env.storage.s3.accessKeyId ||
    !env.storage.s3.secretAccessKey
  ) {
    throw new Error("S3_STORAGE_NOT_CONFIGURED");
  }
}

function assertWebDavConfigured() {
  if (
    !env.storage.webdav.baseUrl ||
    !env.storage.webdav.username ||
    !env.storage.webdav.password
  ) {
    throw new Error("WEBDAV_STORAGE_NOT_CONFIGURED");
  }
}

function buildWebDavUrl(relativePath: string) {
  const url = new URL(env.storage.webdav.baseUrl);
  const currentPath = url.pathname.replace(/\/+$/, "");
  const remotePath = [env.storage.webdav.root, relativePath]
    .filter(Boolean)
    .flatMap((value) => value.split("/"))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  url.pathname = `${currentPath}/${remotePath}`;

  return url.toString();
}
