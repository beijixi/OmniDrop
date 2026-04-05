"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { AppSettings } from "@/lib/settings";

type SettingsFormProps = {
  initialSettings: AppSettings;
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [appName, setAppName] = useState(initialSettings.appName);
  const [shareBaseUrl, setShareBaseUrl] = useState(initialSettings.shareBaseUrl);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          appName,
          shareBaseUrl
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "保存设置失败。");
      }

      setStatus("设置已保存");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSubmitting(false);
      window.setTimeout(() => setStatus(""), 2500);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-6 p-6">
      <div>
        <p className="text-lg font-semibold text-slate-900">基础设置</p>
        <p className="mt-1 text-sm text-slate-500">
          这里只保留 MVP 必要项，尽量简单且可直接使用。
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="appName" className="text-sm font-medium text-slate-700">
          应用名称
        </label>
        <input
          id="appName"
          value={appName}
          onChange={(event) => setAppName(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brandSoft"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="shareBaseUrl" className="text-sm font-medium text-slate-700">
          分享链接基础地址
        </label>
        <input
          id="shareBaseUrl"
          value={shareBaseUrl}
          onChange={(event) => setShareBaseUrl(event.target.value)}
          placeholder="http://localhost:3000"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brandSoft"
        />
        <p className="text-xs text-slate-500">生成分享链接时会使用这个地址。</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-sm font-medium text-slate-700">本地文件存储目录</p>
        <p className="mt-1 break-all font-mono text-xs text-slate-500">
          {initialSettings.storageDir}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          该路径由环境变量 `STORAGE_DIR` 控制，MVP 设置页只展示，不在页面内修改。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500">{status}</span>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "保存中..." : "保存设置"}
        </button>
      </div>
    </form>
  );
}
