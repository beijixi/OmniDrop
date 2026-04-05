import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { saveSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      appName?: string;
      shareBaseUrl?: string;
    };

    const settings = await saveSettings({
      appName: payload.appName || "",
      shareBaseUrl: payload.shareBaseUrl || ""
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return NextResponse.json({
      ok: true,
      settings
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "保存设置失败。"
      },
      {
        status: 400
      }
    );
  }
}
