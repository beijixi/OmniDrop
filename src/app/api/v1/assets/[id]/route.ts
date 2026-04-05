import { streamAssetResponse } from "@/lib/asset-response";

export const runtime = "nodejs";

type AssetRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: AssetRouteProps) {
  return streamAssetResponse(request, params.id);
}
