import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { addEntriesToCollection } from "@/lib/collections";

export const runtime = "nodejs";

type CollectionEntriesRouteProps = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: CollectionEntriesRouteProps) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      ids?: string[];
    };

    if (!Array.isArray(payload.ids) || payload.ids.length === 0) {
      return apiError({
        code: "EMPTY_ENTRY_BATCH",
        message: "请先选择至少一条内容。",
        status: 400
      });
    }

    const result = await addEntriesToCollection(params.id, payload.ids);

    revalidatePath("/collections");
    revalidatePath(`/collections/${params.id}`);

    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "ADD_COLLECTION_ENTRIES_FAILED",
      message: "加入合集失败。",
      status: 400
    });
  }
}
