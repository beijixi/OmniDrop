import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { serializeEntry } from "@/lib/api-serializers";
import {
  cleanupDuplicateEntries,
  deleteEntry,
  getEntryById,
  replaceEntryTags,
  updateEntryState
} from "@/lib/entries";
import { refreshEntryLinkPreview } from "@/lib/link-preview";
import { isReadingState, normalizeReadingState } from "@/lib/reading-states";
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
      note?: string | null;
      pinned?: boolean;
      readingState?: string;
      tags?: string[];
    };

    if (payload.readingState !== undefined && !isReadingState(payload.readingState)) {
      return apiError({
        code: "INVALID_READING_STATE",
        message: "阅读状态无效。",
        status: 400
      });
    }

    if (
      typeof payload.archived !== "boolean" &&
      typeof payload.favorite !== "boolean" &&
      payload.note === undefined &&
      typeof payload.pinned !== "boolean" &&
      payload.readingState === undefined &&
      !Array.isArray(payload.tags)
    ) {
      return apiError({
        code: "EMPTY_ENTRY_UPDATE",
        message: "至少要更新一个状态字段、备注或标签。",
        status: 400
      });
    }

    let currentEntry = null;

    if (
      typeof payload.archived === "boolean" ||
      typeof payload.favorite === "boolean" ||
      payload.note !== undefined ||
      typeof payload.pinned === "boolean" ||
      payload.readingState !== undefined
    ) {
      currentEntry = await updateEntryState(params.id, {
        archived: payload.archived,
        favorite: payload.favorite,
        note: payload.note,
        pinned: payload.pinned,
        readingState:
          payload.readingState !== undefined
            ? normalizeReadingState(payload.readingState)
            : undefined
      });
    }

    if (Array.isArray(payload.tags)) {
      currentEntry = await replaceEntryTags(params.id, payload.tags);
    }

    if (!currentEntry) {
      return apiError({
        code: "EMPTY_ENTRY_UPDATE",
        message: "至少要更新一个状态字段、备注或标签。",
        status: 400
      });
    }

    const [entry, settings] = await Promise.all([
      Promise.resolve(currentEntry),
      getSettings()
    ]);

    revalidatePath("/");
    revalidatePath(`/read/${params.id}`);

    return apiOk({
      entry: serializeEntry(entry, {
        shareBaseUrl: settings.shareBaseUrl
      })
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "UPDATE_ENTRY_FAILED",
      message: "更新条目失败。",
      status: 400
    });
  }
}

export async function POST(request: Request, { params }: EntryRouteProps) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: string;
    };

    if (payload.action === "cleanup_duplicates") {
      const result = await cleanupDuplicateEntries(params.id);

      revalidatePath("/");
      revalidatePath("/duplicates");

      return apiOk(result);
    }

    if (payload.action === "refresh_link_preview") {
      await refreshEntryLinkPreview(params.id);

      const [entry, settings] = await Promise.all([getEntryById(params.id), getSettings()]);

      if (!entry) {
        return apiError({
          code: "ENTRY_NOT_FOUND",
          message: "条目不存在。",
          status: 404
        });
      }

      revalidatePath("/");
      revalidatePath("/collections");

      return apiOk({
        entry: serializeEntry(entry, {
          shareBaseUrl: settings.shareBaseUrl
        }),
        refreshed: true
      });
    }

    {
      return apiError({
        code: "UNSUPPORTED_ENTRY_ACTION",
        message: "不支持的条目动作。",
        status: 400
      });
    }
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "ENTRY_ACTION_FAILED",
      message: "执行条目动作失败。",
      status: 400
    });
  }
}
