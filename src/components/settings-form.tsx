"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { AppSettings } from "@/lib/settings";

type SettingsFormProps = {
  initialSettings: AppSettings;
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [shareBaseUrl, setShareBaseUrl] = useState(initialSettings.shareBaseUrl);
  const [internalShareBaseUrl, setInternalShareBaseUrl] = useState(
    initialSettings.internalShareBaseUrl
  );
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/v1/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          shareBaseUrl,
          internalShareBaseUrl
        })
      });

      const payload = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message || t("settings.save"));
      }

      setStatus(t("settings.saved"));
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
      <div className="space-y-2">
        <label htmlFor="shareBaseUrl" className="text-sm font-medium text-slate-700">
          {t("settings.public_share_base_url")}
        </label>
        <input
          id="shareBaseUrl"
          value={shareBaseUrl}
          onChange={(event) => setShareBaseUrl(event.target.value)}
          placeholder="http://localhost:3000"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brandSoft"
        />
        <p className="text-xs text-slate-500">{t("settings.public_share_base_url_help")}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="internalShareBaseUrl" className="text-sm font-medium text-slate-700">
          {t("settings.internal_share_base_url")}
        </label>
        <input
          id="internalShareBaseUrl"
          value={internalShareBaseUrl}
          onChange={(event) => setInternalShareBaseUrl(event.target.value)}
          placeholder="http://<your-internal-host>:3000"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brandSoft"
        />
        <p className="text-xs text-slate-500">{t("settings.internal_share_base_url_help")}</p>
      </div>

      <LocaleSwitcher variant="field" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500">{status}</span>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("settings.saving") : t("settings.save")}
        </button>
      </div>
    </form>
  );
}
