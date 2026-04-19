import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { cleanupDuplicateGroup, type DuplicateGroupAction } from "@/lib/entries";
import type { DuplicateKind } from "@/lib/dedupe";

export const runtime = "nodejs";

const supportedActions = new Set<DuplicateGroupAction>([
  "keep_entry",
  "keep_newest",
  "keep_oldest",
  "keep_preferred"
]);

const supportedKinds = new Set<DuplicateKind>(["asset", "text", "url"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: string;
      entryId?: string;
      key?: string;
      kind?: string;
    };

    if (!payload.action || !supportedActions.has(payload.action as DuplicateGroupAction)) {
      return NextResponse.json(
        {
          error: "不支持的重复组动作。"
        },
        {
          status: 400
        }
      );
    }

    if (!payload.key || !payload.kind || !supportedKinds.has(payload.kind as DuplicateKind)) {
      return NextResponse.json(
        {
          error: "重复组标识无效。"
        },
        {
          status: 400
        }
      );
    }

    const result = await cleanupDuplicateGroup({
      action: payload.action as DuplicateGroupAction,
      entryId: payload.entryId,
      key: payload.key,
      kind: payload.kind as DuplicateKind
    });

    revalidatePath("/");
    revalidatePath("/duplicates");

    return NextResponse.json({
      ...result,
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "执行重复组动作失败。"
      },
      {
        status: 400
      }
    );
  }
}
