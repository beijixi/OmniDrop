import { revalidatePath } from "next/cache";

import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { serializeEntry } from "@/lib/api-serializers";
import { indexEntryAssetsSearchText } from "@/lib/asset-search-index";
import { createEntriesBatch, listEntriesPage } from "@/lib/entries";
import { resolveSenderFromRequest } from "@/lib/request-source";
import { getSettings } from "@/lib/settings";
import { saveIncomingFiles } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitValue = searchParams.get("limit");
    const limit = limitValue ? Number.parseInt(limitValue, 10) : undefined;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";
    const cursor = searchParams.get("cursor") || "";

    const [page, settings] = await Promise.all([
      listEntriesPage({
        cursor,
        limit,
        q: query,
        type
      }),
      getSettings()
    ]);

    return apiOk({
      entries: page.entries.map((entry) =>
        serializeEntry(entry, {
          shareBaseUrl: settings.shareBaseUrl
        })
      ),
      nextCursor: page.nextCursor,
      limit: page.limit
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "LIST_ENTRIES_FAILED",
      message: "读取条目列表失败。",
      status: 400
    });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let message = "";
    let senderNameOverride = "";
    let files: File[] = [];

    if (contentType.includes("application/json")) {
      const payload = (await request.json()) as {
        message?: string;
        senderName?: string;
      };

      message = String(payload.message || "");
      senderNameOverride = String(payload.senderName || "");
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      message = String(formData.get("message") || "");
      senderNameOverride = String(formData.get("senderName") || "");
      files = formData
        .getAll("files")
        .filter((item): item is File => item instanceof File && item.size > 0);
    } else {
      return apiError({
        code: "UNSUPPORTED_CONTENT_TYPE",
        message: "仅支持 application/json 或 multipart/form-data。",
        status: 415
      });
    }

    const uploads = files.length > 0 ? await saveIncomingFiles(files) : [];
    const sender = await resolveSenderFromRequest(request);

    if (senderNameOverride.trim()) {
      sender.senderName = senderNameOverride.trim();
    }

    const entries = await createEntriesBatch({
      message,
      sender,
      uploads
    });

    try {
      await indexEntryAssetsSearchText(entries);
    } catch (error) {
      console.error("Failed to index uploaded asset text", error);
    }

    const settings = await getSettings();

    revalidatePath("/");

    return apiOk(
      {
        count: entries.length,
        entries: entries.map((entry) =>
          serializeEntry(entry, {
            shareBaseUrl: settings.shareBaseUrl
          })
        )
      },
      {
        status: 201
      }
    );
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "CREATE_ENTRY_FAILED",
      message: "保存条目失败。",
      status: 400
    });
  }
}
