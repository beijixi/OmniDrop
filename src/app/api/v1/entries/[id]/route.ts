import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { serializeEntry } from "@/lib/api-serializers";
import { cleanupDuplicateEntries, deleteEntry, getEntryById, updateEntryState } from "@/lib/entries";
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

export async function PATCH(request: Request, { params }: EntryRouteProps) {
  try {
    const payload = (await request.json()) as {
      archived?: boolean;
      favorite?: boolean;
      pinned?: boolean;
    };

    if (
      typeof payload.archived !== "boolean" &&
      typeof payload.favorite !== "boolean" &&
      typeof payload.pinned !== "boolean"
    ) {
      return apiError({
        code: "EMPTY_ENTRY_UPDATE",
        message: "至少要更新一个状态字段。",
        status: 400
      });
    }

    const [entry, settings] = await Promise.all([
      updateEntryState(params.id, {
        archived: payload.archived,
        favorite: payload.favorite,
        pinned: payload.pinned
      }),
      getSettings()
    ]);

    revalidatePath("/");

    return apiOk({
      entry: serializeEntry(entry, {
        shareBaseUrl: settings.shareBaseUrl
      })
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "UPDATE_ENTRY_FAILED",
      message: "更新条目状态失败。",
      status: 400
    });
  }
}

export async function POST(request: Request, { params }: EntryRouteProps) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: string;
    };

    if (payload.action !== "cleanup_duplicates") {
      return apiError({
        code: "UNSUPPORTED_ENTRY_ACTION",
        message: "不支持的条目动作。",
        status: 400
      });
    }

    const result = await cleanupDuplicateEntries(params.id);

    revalidatePath("/");

    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "ENTRY_ACTION_FAILED",
      message: "执行条目动作失败。",
      status: 400
    });
  }
}
