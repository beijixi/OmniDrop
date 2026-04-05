import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { serializeEntry } from "@/lib/api-serializers";
import { deleteEntry, getEntryById } from "@/lib/entries";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

type EntryRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: EntryRouteProps) {
  try {
    const [entry, settings] = await Promise.all([getEntryById(params.id), getSettings()]);

    if (!entry) {
      return apiError({
        code: "ENTRY_NOT_FOUND",
        message: "条目不存在。",
        status: 404
      });
    }

    return apiOk({
      entry: serializeEntry(entry, {
        shareBaseUrl: settings.shareBaseUrl
      })
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "GET_ENTRY_FAILED",
      message: "读取条目失败。",
      status: 400
    });
  }
}

export async function DELETE(_request: Request, { params }: EntryRouteProps) {
  try {
    await deleteEntry(params.id);

    revalidatePath("/");

    return apiOk({
      deleted: true,
      entryId: params.id
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "DELETE_ENTRY_FAILED",
      message: "删除条目失败。",
      status: 400
    });
  }
}
