import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { serializeCollection, serializeCollectionSummary } from "@/lib/api-serializers";
import { createCollection, getCollectionSummaries } from "@/lib/collections";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [collections, settings] = await Promise.all([getCollectionSummaries(), getSettings()]);

    return apiOk({
      collections: collections.map((collection) =>
        serializeCollectionSummary(collection, {
          shareBaseUrl: settings.shareBaseUrl
        })
      )
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "LIST_COLLECTIONS_FAILED",
      message: "读取合集失败。",
      status: 400
    });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      description?: string | null;
      entryIds?: string[];
      title?: string;
    };

    if (!payload.title?.trim()) {
      return apiError({
        code: "EMPTY_COLLECTION_TITLE",
        message: "请先填写合集标题。",
        status: 400
      });
    }

    const [collection, settings] = await Promise.all([
      createCollection({
        description: payload.description,
        entryIds: payload.entryIds,
        title: payload.title
      }),
      getSettings()
    ]);

    revalidatePath("/");
    revalidatePath("/collections");
    revalidatePath(`/collections/${collection.id}`);

    return apiOk(
      {
        collection: serializeCollection(collection, {
          shareBaseUrl: settings.shareBaseUrl
        })
      },
      {
        status: 201
      }
    );
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "CREATE_COLLECTION_FAILED",
      message: "创建合集失败。",
      status: 400
    });
  }
}
