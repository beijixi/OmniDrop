import { revalidatePath } from "next/cache";

import { apiErrorFromUnknown, apiOk } from "@/lib/api-response";
import { deleteSavedView } from "@/lib/saved-views";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await deleteSavedView(context.params.id);
    revalidatePath("/");

    return apiOk({
      id: context.params.id
    });
  } catch (error) {
    return apiErrorFromUnknown(error, {
      code: "DELETE_SAVED_VIEW_FAILED",
      message: "删除筛选视图失败。",
      status: 400
    });
  }
}
