import { streamStoredAssetResponse } from "@/lib/asset-response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type CollectionShareAssetRouteProps = {
  params: {
    id: string;
    token: string;
  };
};

export async function GET(request: Request, { params }: CollectionShareAssetRouteProps) {
  const asset = await prisma.asset.findFirst({
    where: {
      entry: {
        collections: {
          some: {
            collection: {
              shareLink: {
                is: {
                  revokedAt: null,
                  token: params.token
                }
              }
            }
          }
        }
      },
      id: params.id
    }
  });

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
