import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { applyEntryBatchAction, type EntryBatchAction } from "@/lib/entries";

export const runtime = "nodejs";

const supportedBatchActions = new Set<EntryBatchAction>([
  "add_tags",
  "archive",
  "delete",
  "favorite",
  "mark_done",
  "mark_inbox",
  "mark_later",
  "mark_reading",
  "pin",
  "unarchive",
  "unfavorite",
  "unpin"
]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: string;
      ids?: string[];
      tags?: string[];
    };

    if (!payload.action || !supportedBatchActions.has(payload.action as EntryBatchAction)) {
      return apiError({
        code: "UNSUPPORTED_ENTRY_BATCH_ACTION",
        message: "不支持的批量动作。",
        status: 400
      });
    }

    if (!Array.isArray(payload.ids)) {
      return apiError({
        code: "EMPTY_ENTRY_BATCH",
        message: "请先选择至少一条内容。",
        status: 400
      });
    }

    const result = await applyEntryBatchAction(payload.ids, payload.action as EntryBatchAction, {
      tags: payload.tags
    });

    revalidatePath("/");

    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "ENTRY_BATCH_ACTION_FAILED",
      message: "执行批量动作失败。",
      status: 400
    });
  }
}
