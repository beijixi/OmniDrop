import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { applyEntryBatchAction, type EntryBatchAction } from "@/lib/entries";

export const runtime = "nodejs";

const supportedBatchActions = new Set<EntryBatchAction>([
  "archive",
  "delete",
  "favorite",
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
    };

    if (!payload.action || !supportedBatchActions.has(payload.action as EntryBatchAction)) {
      return NextResponse.json(
        {
          error: "不支持的批量动作。"
        },
        {
          status: 400
        }
      );
    }

    if (!Array.isArray(payload.ids)) {
      return NextResponse.json(
        {
          error: "请先选择至少一条内容。"
        },
        {
          status: 400
        }
      );
    }

    const result = await applyEntryBatchAction(payload.ids, payload.action as EntryBatchAction);

    revalidatePath("/");

    return NextResponse.json({
      ...result,
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "执行批量动作失败。"
      },
      {
        status: 400
      }
    );
  }
}
