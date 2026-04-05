import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { deleteEntry } from "@/lib/entries";

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
