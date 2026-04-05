import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getStoredFilePath } from "@/lib/storage";

export const runtime = "nodejs";

type AssetRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: AssetRouteProps) {
  const asset = await prisma.asset.findUnique({
    where: {
      id: params.id
    }
  });

  if (!asset) {
    return NextResponse.json({ error: "文件不存在。" }, { status: 404 });
  }

  const filePath = getStoredFilePath(asset.relativePath);

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
      status: 206,
      headers
    });
  } catch {
    return NextResponse.json({ error: "文件读取失败。" }, { status: 500 });
  }
}
