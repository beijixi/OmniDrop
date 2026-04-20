import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { indexEntryAssetsSearchText } from "@/lib/asset-search-index";
import { createEntriesBatch } from "@/lib/entries";
import { indexEntryLinkPreviews } from "@/lib/link-preview";
import { resolveSenderFromRequest } from "@/lib/request-source";
import { saveIncomingFiles } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const message = String(formData.get("message") || "");
    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);
    const uploads = files.length > 0 ? await saveIncomingFiles(files) : [];
    const sender = await resolveSenderFromRequest(request);

    const entries = await createEntriesBatch({
      message,
      sender,
      uploads
    });

    try {
      await indexEntryAssetsSearchText(entries);
    } catch (indexError) {
      console.error("Failed to index uploaded asset text", indexError);
    }

    try {
      await indexEntryLinkPreviews(entries);
    } catch (indexError) {
      console.error("Failed to index entry link previews", indexError);
    }

    revalidatePath("/");

    return NextResponse.json({
      count: entries.length,
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "保存条目失败。"
      },
      {
        status: 400
      }
    );
  }
}
