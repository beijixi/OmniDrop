import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { cleanupDuplicateEntries, deleteEntry, updateEntryState } from "@/lib/entries";

export const runtime = "nodejs";

type EntryRouteProps = {
  params: {
    id: string;
  };
};

export async function DELETE(_request: Request, { params }: EntryRouteProps) {
  try {
    await deleteEntry(params.id);

    revalidatePath("/");

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "删除条目失败。"
      },
      {
        status: 400
      }
    );
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
      return NextResponse.json(
        {
          error: "至少要更新一个状态字段。"
        },
        {
          status: 400
        }
      );
    }

    const entry = await updateEntryState(params.id, payload);

    revalidatePath("/");

    return NextResponse.json({
      entry: {
        archivedAt: entry.archivedAt?.toISOString() || null,
        id: entry.id,
        isFavorite: entry.isFavorite,
        pinnedAt: entry.pinnedAt?.toISOString() || null
      },
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "更新条目状态失败。"
      },
      {
        status: 400
      }
    );
  }
}

export async function POST(request: Request, { params }: EntryRouteProps) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: string;
    };

    if (payload.action !== "cleanup_duplicates") {
      return NextResponse.json(
        {
          error: "不支持的条目动作。"
        },
        {
          status: 400
        }
      );
    }

    const result = await cleanupDuplicateEntries(params.id);

    revalidatePath("/");

    return NextResponse.json({
      ...result,
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "执行条目动作失败。"
      },
      {
        status: 400
      }
    );
  }
}
