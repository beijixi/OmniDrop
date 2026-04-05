import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { StorageDriver } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildWebDavFileUrl,
  getLocalStoredFilePath,
  getS3Bucket,
  getS3Client,
  getWebDavAuthHeaders
} from "@/lib/storage";

export type StreamableAsset = {
  mimeType: string;
  originalName: string;
  relativePath: string;
  storageDriver: StorageDriver;
};

export async function findAssetById(assetId: string) {
  return prisma.asset.findUnique({
    where: {
      id: assetId
    }
  });
}

export async function streamAssetResponse(request: Request, assetId: string) {
  const asset = await findAssetById(assetId);

  if (!asset) {
    return NextResponse.json({ error: "文件不存在。" }, { status: 404 });
  }

  return streamStoredAssetResponse(request, asset);
}

export async function streamStoredAssetResponse(request: Request, asset: StreamableAsset) {
  switch (asset.storageDriver) {
    case StorageDriver.S3:
      return streamS3AssetResponse(request, asset);
    case StorageDriver.WEBDAV:
      return streamWebDavAssetResponse(request, asset);
    default:
      return streamLocalAssetResponse(request, asset);
  }
}

async function streamLocalAssetResponse(
  request: Request,
  asset: StreamableAsset
) {
  const filePath = getLocalStoredFilePath(asset.relativePath);

  try {
    const fileStat = await stat(filePath);
    const range = request.headers.get("range");
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.originalName)}`,
      "Content-Length": String(fileStat.size),
      "Content-Type": asset.mimeType
    });

    if (!range) {
      const stream = createReadStream(filePath);

      return new Response(Readable.toWeb(stream) as ReadableStream, {
        headers
      });
    }

    const bytesPrefix = "bytes=";
    const [startValue, endValue] = range.replace(bytesPrefix, "").split("-");
    const start = Number.parseInt(startValue, 10);
    const end = endValue ? Number.parseInt(endValue, 10) : fileStat.size - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= fileStat.size) {
      return new Response("Requested range not satisfiable", {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileStat.size}`
        }
      });
    }

    const chunkSize = end - start + 1;
    const stream = createReadStream(filePath, { start, end });

    headers.set("Content-Length", String(chunkSize));
    headers.set("Content-Range", `bytes ${start}-${end}/${fileStat.size}`);

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers,
      status: 206
    });
  } catch {
    return NextResponse.json({ error: "文件读取失败。" }, { status: 500 });
  }
}

async function streamS3AssetResponse(
  request: Request,
  asset: StreamableAsset
) {
  try {
    const result = await getS3Client().send(
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: asset.relativePath,
        Range: request.headers.get("range") || undefined
      })
    );

    if (!result.Body) {
      return NextResponse.json({ error: "文件读取失败。" }, { status: 500 });
    }

    const headers = new Headers({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.originalName)}`,
      "Content-Type": result.ContentType || asset.mimeType
    });

    if (result.AcceptRanges) {
      headers.set("Accept-Ranges", result.AcceptRanges);
    }

    if (result.ContentLength !== undefined) {
      headers.set("Content-Length", String(result.ContentLength));
    }

    if (result.ContentRange) {
      headers.set("Content-Range", result.ContentRange);
    }

    return new Response(toWebStream(result.Body), {
      headers,
      status: request.headers.get("range") ? 206 : 200
    });
  } catch {
    return NextResponse.json({ error: "文件读取失败。" }, { status: 500 });
  }
}

async function streamWebDavAssetResponse(
  request: Request,
  asset: StreamableAsset
) {
  try {
    const upstream = await fetch(buildWebDavFileUrl(asset.relativePath), {
      headers: {
        ...getWebDavAuthHeaders(),
        ...(request.headers.get("range")
          ? {
              Range: request.headers.get("range") || ""
            }
          : {})
      }
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: "文件读取失败。" }, { status: upstream.status || 500 });
    }

    const headers = new Headers({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.originalName)}`,
      "Content-Type": upstream.headers.get("content-type") || asset.mimeType
    });

    copyHeaderIfPresent(upstream.headers, headers, "accept-ranges");
    copyHeaderIfPresent(upstream.headers, headers, "content-length");
    copyHeaderIfPresent(upstream.headers, headers, "content-range");

    return new Response(upstream.body, {
      headers,
      status: upstream.status
    });
  } catch {
    return NextResponse.json({ error: "文件读取失败。" }, { status: 500 });
  }
}

function copyHeaderIfPresent(
  source: Headers,
  target: Headers,
  key: "accept-ranges" | "content-length" | "content-range"
) {
  const value = source.get(key);

  if (value) {
    target.set(key, value);
  }
}

function toWebStream(body: unknown): ReadableStream {
  if (body && typeof body === "object" && "transformToWebStream" in body) {
    return (body as { transformToWebStream: () => ReadableStream }).transformToWebStream();
  }

  if (body instanceof Readable) {
    return Readable.toWeb(body) as ReadableStream;
  }

  if (body && typeof body === "object" && "getReader" in body) {
    return body as ReadableStream;
  }

  throw new Error("UNSUPPORTED_STREAM_BODY");
}
