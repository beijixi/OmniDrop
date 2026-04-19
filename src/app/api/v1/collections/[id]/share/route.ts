import { revalidatePath } from "next/cache";

import { apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { createCollectionShareLink, revokeCollectionShareLink } from "@/lib/collections";
import { buildShareUrlSet } from "@/lib/share-links";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

type CollectionShareRouteProps = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: CollectionShareRouteProps) {
  try {
    const [shareLink, settings] = await Promise.all([
      createCollectionShareLink(params.id),
      getSettings()
    ]);
    const shareUrls = buildShareUrlSet({
      path: `/share/collections/${shareLink.token}`,
      request,
      settings,
      token: shareLink.token
    });

    revalidatePath("/collections");
    revalidatePath(`/collections/${params.id}`);

    return apiOk({
      share: {
        internalUrl: shareUrls.internalUrl,
        preferredMode: shareUrls.preferredMode,
        preferredUrl: shareUrls.preferredUrl,
        publicUrl: shareUrls.publicUrl,
        revokedAt: shareLink.revokedAt?.toISOString() || null,
        token: shareLink.token,
        url: shareUrls.preferredUrl
      }
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "CREATE_COLLECTION_SHARE_FAILED",
      message: "生成合集分享失败。",
      status: 400
    });
  }
}

export async function DELETE(_request: Request, { params }: CollectionShareRouteProps) {
  try {
    const shareLink = await revokeCollectionShareLink(params.id);

    revalidatePath("/collections");
    revalidatePath(`/collections/${params.id}`);

    return apiOk({
      share: {
        revokedAt: shareLink?.revokedAt?.toISOString() || new Date().toISOString(),
        url: null
      }
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "REVOKE_COLLECTION_SHARE_FAILED",
      message: "撤销合集分享失败。",
      status: 400
    });
  }
}
