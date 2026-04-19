import { revalidatePath } from "next/cache";

import { apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { createSavedView } from "@/lib/saved-views";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      duplicatesOnly?: boolean;
      name?: string;
      q?: string;
      tag?: string;
      type?: string;
      view?: string;
    };
    const savedView = await createSavedView({
      duplicatesOnly: payload.duplicatesOnly,
      name: String(payload.name || ""),
      q: payload.q,
      tag: payload.tag,
      type: payload.type,
      view: payload.view
    });

    revalidatePath("/");

    return apiOk({
      savedView
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "SAVE_VIEW_FAILED",
      message: "保存筛选视图失败。",
      status: 400
    });
  }
}
