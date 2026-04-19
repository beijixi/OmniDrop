import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { moveCollectionEntry, removeEntryFromCollection } from "@/lib/collections";

export const runtime = "nodejs";

type CollectionEntryRouteProps = {
  params: {
    entryId: string;
    id: string;
  };
};

export async function PATCH(request: Request, { params }: CollectionEntryRouteProps) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      direction?: "down" | "up";
    };

    if (payload.direction !== "up" && payload.direction !== "down") {
      return apiError({
        code: "INVALID_COLLECTION_MOVE_DIRECTION",
        message: "移动方向无效。",
        status: 400
      });
    }

    const collection = await moveCollectionEntry(params.id, params.entryId, payload.direction);

    revalidatePath("/collections");
    revalidatePath(`/collections/${params.id}`);

    return apiOk({
      collectionId: collection.id,
      moved: true
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "MOVE_COLLECTION_ENTRY_FAILED",
      message: "调整合集顺序失败。",
      status: 400
    });
  }
}

export async function DELETE(_request: Request, { params }: CollectionEntryRouteProps) {
  try {
    await removeEntryFromCollection(params.id, params.entryId);

    revalidatePath("/collections");
    revalidatePath(`/collections/${params.id}`);

    return apiOk({
      collectionId: params.id,
      entryId: params.entryId,
      removed: true
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "REMOVE_COLLECTION_ENTRY_FAILED",
      message: "移出合集失败。",
      status: 400
    });
  }
}
