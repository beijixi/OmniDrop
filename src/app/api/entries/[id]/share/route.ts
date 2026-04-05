import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createShareLink, revokeShareLink } from "@/lib/entries";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

type ShareRouteProps = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, { params }: ShareRouteProps) {
  try {
    const [shareLink, settings] = await Promise.all([
      createShareLink(params.id),
      getSettings()
    ]);

    revalidatePath("/");

    return NextResponse.json({
      ok: true,
      url: `${settings.shareBaseUrl}/share/${shareLink.token}`
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "生成分享链接失败。"
      },
      {
        status: 400
      }
    );
  }
}

export async function DELETE(_request: Request, { params }: ShareRouteProps) {
  try {
    await revokeShareLink(params.id);

    revalidatePath("/");

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "撤销分享失败。"
      },
      {
        status: 400
      }
    );
  }
}
