import { revalidatePath } from "next/cache";

import { apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { createShareLink, revokeShareLink } from "@/lib/entries";
import { buildShareUrlSet } from "@/lib/share-links";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

type ShareRouteProps = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: ShareRouteProps) {
  try {
    const [shareLink, settings] = await Promise.all([
      createShareLink(params.id),
      getSettings()
    ]);
    const shareUrls = buildShareUrlSet({
      request,
      settings,
      token: shareLink.token
    });

    revalidatePath("/");

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
      code: "CREATE_SHARE_FAILED",
      message: "生成分享链接失败。",
      status: 400
    });
  }
}

export async function DELETE(_request: Request, { params }: ShareRouteProps) {
  try {
    const shareLink = await revokeShareLink(params.id);

    revalidatePath("/");

    return apiOk({
      share: {
        revokedAt: shareLink?.revokedAt?.toISOString() || new Date().toISOString(),
        url: null
      }
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "REVOKE_SHARE_FAILED",
      message: "撤销分享失败。",
      status: 400
    });
  }
}
