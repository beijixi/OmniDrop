"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";

export function CollectionCreatePanel() {
  const router = useRouter();
  const { t } = useI18n();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");

  function setTransientStatus(nextStatus: string) {
    setStatus(nextStatus);
    window.setTimeout(() => setStatus(""), 2600);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setTransientStatus(t("collections.title_required"));
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/v1/collections", {
        body: JSON.stringify({
          description,
          title
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            data?: {
              collection?: {
                id?: string;
                title?: string;
              };
            };
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok || !payload?.data?.collection?.id) {
        throw new Error(payload?.error?.message || t("collections.action_failed"));
      }

      const nextCollection = payload.data.collection;
      setTitle("");
      setDescription("");
      router.push(`/collections/${nextCollection.id}`);
      router.refresh();
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("collections.action_failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel px-4 py-4 sm:px-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{t("collections.create_title")}</p>
        <p className="text-sm leading-6 text-slate-500">{t("collections.create_description")}</p>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("collections.title_placeholder")}
          className="h-11 w-full rounded-[16px] border border-slate-200/80 bg-white/92 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("collections.description_placeholder")}
          rows={3}
          className="w-full rounded-[16px] border border-slate-200/80 bg-white/92 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[linear-gradient(135deg,#0f172a,#0f766e_58%,#38bdf8)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(14,165,233,0.18)] transition disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? t("actions.processing") : t("collections.create")}
        </button>
      </form>

      {status ? (
        <div className="mt-3 rounded-[18px] border border-white/78 bg-white/72 px-3 py-2 text-sm leading-6 text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
          {status}
        </div>
      ) : null}
    </section>
  );
}
