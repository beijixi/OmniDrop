import { prisma } from "@/lib/prisma";
import { streamStoredAssetResponse } from "@/lib/asset-response";

export const runtime = "nodejs";

type ShareAssetRouteProps = {
  params: {
    id: string;
    token: string;
  };
};

export async function GET(request: Request, { params }: ShareAssetRouteProps) {
  const shareLink = await prisma.shareLink.findFirst({
    include: {
      entry: {
        select: {
          assets: {
            take: 1,
            where: {
              id: params.id
            }
          }
        }
      }
    },
    where: {
      revokedAt: null,
      token: params.token
    }
  });

  const asset = shareLink?.entry.assets[0];

  if (!asset) {
    return Response.json(
      {
        error: "文件不存在。"
      },
      { status: 404 }
    );
  }

  return streamStoredAssetResponse(request, asset);
}
