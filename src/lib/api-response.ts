import { NextResponse } from "next/server";

type ApiErrorShape = {
  code: string;
  message: string;
};

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      ok: true,
      data
    },
    init
  );
}

export function apiError(input: {
  code: string;
  message: string;
  status?: number;
}) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: input.code,
        message: input.message
      } satisfies ApiErrorShape
    },
    {
      status: input.status || 400
    }
  );
}

export function apiErrorFromUnknown(
  error: unknown,
  fallback: {
    code: string;
    message: string;
    status?: number;
  }
) {
  if (error instanceof Error) {
    switch (error.message) {
      case "ENTRY_NOT_FOUND":
        return apiError({
          code: "ENTRY_NOT_FOUND",
          message: "条目不存在。",
          status: 404
        });
      case "EMPTY_ENTRY":
        return apiError({
          code: "EMPTY_ENTRY",
          message: "请输入文本，或者添加至少一个文件。",
          status: 400
        });
      case "INVALID_CURSOR":
        return apiError({
          code: "INVALID_CURSOR",
          message: "分页游标无效。",
          status: 400
        });
      case "EMPTY_SAVED_VIEW":
        return apiError({
          code: "EMPTY_SAVED_VIEW",
          message: "请先选择搜索、类型、视图或重复项条件后再保存。",
          status: 400
        });
      case "EMPTY_SAVED_VIEW_NAME":
        return apiError({
          code: "EMPTY_SAVED_VIEW_NAME",
          message: "请填写筛选视图名称。",
          status: 400
        });
      case "SAVED_VIEW_NOT_FOUND":
        return apiError({
          code: "SAVED_VIEW_NOT_FOUND",
          message: "筛选视图不存在。",
          status: 404
        });
      default:
        return apiError({
          code: fallback.code,
          message: error.message || fallback.message,
          status: fallback.status
        });
    }
  }

  return apiError(fallback);
}
