import { revalidatePath } from "next/cache";

import { apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { serializeSettings } from "@/lib/api-serializers";
import { getSettings, saveSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();

    return apiOk({
      settings: serializeSettings(settings)
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "GET_SETTINGS_FAILED",
      message: "读取设置失败。",
      status: 400
    });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as {
      appName?: string;
      shareBaseUrl?: string;
      internalShareBaseUrl?: string;
    };

    const settings = await saveSettings({
      appName: payload.appName,
      shareBaseUrl: payload.shareBaseUrl || "",
      internalShareBaseUrl: payload.internalShareBaseUrl
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return apiOk({
      settings: serializeSettings(settings)
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "SAVE_SETTINGS_FAILED",
      message: "保存设置失败。",
      status: 400
    });
  }
}
