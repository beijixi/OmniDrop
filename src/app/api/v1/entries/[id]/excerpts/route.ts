import { revalidatePath } from "next/cache";

import { apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { createExcerpt } from "@/lib/excerpts";

export const runtime = "nodejs";

type EntryExcerptRouteProps = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: EntryExcerptRouteProps) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      assetId?: string | null;
      content?: string;
      note?: string | null;
      source?: string;
    };

    const excerpt = await createExcerpt({
      assetId: payload.assetId,
      content: payload.content || "",
      entryId: params.id,
      note: payload.note,
      source: payload.source || "MESSAGE"
    });

    revalidatePath("/");
    revalidatePath("/collections");
    revalidatePath(`/read/${params.id}`);

    return apiOk({
      excerpt
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "CREATE_EXCERPT_FAILED",
      message: "保存摘录失败。",
      status: 400
    });
  }
}
