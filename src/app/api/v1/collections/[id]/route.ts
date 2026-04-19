import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { serializeCollection } from "@/lib/api-serializers";
import { deleteCollection, getCollectionById, updateCollection } from "@/lib/collections";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

type CollectionRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: CollectionRouteProps) {
  try {
    const [collection, settings] = await Promise.all([
      getCollectionById(params.id),
      getSettings()
    ]);

    if (!collection) {
      return apiError({
        code: "COLLECTION_NOT_FOUND",
        message: "合集不存在。",
        status: 404
      });
    }

    return apiOk({
      collection: serializeCollection(collection, {
        shareBaseUrl: settings.shareBaseUrl
      })
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "GET_COLLECTION_FAILED",
      message: "读取合集失败。",
      status: 400
    });
  }
}

export async function PATCH(request: Request, { params }: CollectionRouteProps) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      description?: string | null;
      title?: string;
    };

    if (payload.title === undefined && payload.description === undefined) {
      return apiError({
        code: "EMPTY_COLLECTION_UPDATE",
        message: "至少要更新合集标题或描述。",
        status: 400
      });
    }

    const [collection, settings] = await Promise.all([
      updateCollection(params.id, {
        description: payload.description,
        title: payload.title
      }),
      getSettings()
    ]);

    revalidatePath("/collections");
    revalidatePath(`/collections/${params.id}`);

    return apiOk({
      collection: serializeCollection(collection, {
        shareBaseUrl: settings.shareBaseUrl
      })
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "UPDATE_COLLECTION_FAILED",
      message: "更新合集失败。",
      status: 400
    });
  }
}

export async function DELETE(_request: Request, { params }: CollectionRouteProps) {
  try {
    await deleteCollection(params.id);

    revalidatePath("/collections");

    return apiOk({
      collectionId: params.id,
      deleted: true
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "DELETE_COLLECTION_FAILED",
      message: "删除合集失败。",
      status: 400
    });
  }
}
