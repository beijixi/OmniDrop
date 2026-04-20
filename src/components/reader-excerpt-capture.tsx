"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

type ReaderExcerptCaptureProps = {
  entryId: string;
};

type SelectionPayload = {
  assetId: string | null;
  content: string;
  source: "ASSET" | "LINK" | "MESSAGE" | "NOTE";
  sourceLabel: string;
};

export function ReaderExcerptCapture({ entryId }: ReaderExcerptCaptureProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [selection, setSelection] = useState<SelectionPayload | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedPreview = useMemo(() => {
    if (!selection) {
      return "";
    }

    return selection.content.length > 280 ? `${selection.content.slice(0, 280)}…` : selection.content;
  }, [selection]);
  const helperText = status || (selection ? selection.sourceLabel : t("excerpt.empty"));

  useEffect(() => {
    function handleSelectionChange() {
      const nextSelection = getReaderSelection();
      setSelection(nextSelection);
    }

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  useEffect(() => {
    if (!status) {
      return undefined;
    }

    const timer = window.setTimeout(() => setStatus(""), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleSave() {
    if (!selection) {
      setStatus(t("excerpt.save_failed"));
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/v1/entries/${entryId}/excerpts`, {
        body: JSON.stringify({
          assetId: selection.assetId,
          content: selection.content,
          note,
          source: selection.source
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message || t("excerpt.save_failed"));
      }

      setNote("");
      setSelection(null);
      window.getSelection()?.removeAllRanges();
      setStatus(t("excerpt.saved"));
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("excerpt.save_failed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
            {t("excerpt.title")}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{t("excerpt.select_hint")}</p>

          {selection ? (
            <div className="mt-4 rounded-[22px] border border-emerald-100/90 bg-emerald-50/84 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-700">
                <span className="font-semibold">{t("excerpt.selection_label")}</span>
                <span>·</span>
                <span>{selection.sourceLabel}</span>
              </div>
              <blockquote className="mt-3 whitespace-pre-wrap break-words border-l-2 border-emerald-200 pl-3 text-sm leading-7 text-slate-700">
                {selectedPreview}
              </blockquote>
            </div>
          ) : null}
        </div>

        <div className="w-full max-w-lg rounded-[22px] border border-white/80 bg-white/82 p-4 shadow-[0_14px_28px_rgba(15,23,42,0.06)]">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {t("excerpt.note_label")}
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            placeholder={t("excerpt.note_placeholder")}
            rows={3}
            className="mt-2 w-full resize-y rounded-[18px] border border-slate-200/90 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-200 focus:ring-2 focus:ring-emerald-100"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p
              className={cn(
                "text-sm",
                status ? "text-emerald-700" : selection ? "text-slate-500" : "text-slate-400"
              )}
            >
              {helperText}
            </p>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!selection || isSaving}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? t("actions.processing") : t("excerpt.save")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function getReaderSelection(): SelectionPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const text = selection.toString().replace(/\r\n/g, "\n").trim();

  if (!text) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const root = getClosestElement(range.commonAncestorContainer)?.closest("[data-reader-excerpt-root='true']");

  if (!root) {
    return null;
  }

  const sourceNode = getClosestElement(range.commonAncestorContainer)?.closest<HTMLElement>("[data-excerpt-source]");

  if (!sourceNode) {
    return null;
  }

  const source = sourceNode.dataset.excerptSource;

  if (source !== "ASSET" && source !== "LINK" && source !== "MESSAGE" && source !== "NOTE") {
    return null;
  }

  return {
    assetId: sourceNode.dataset.assetId || null,
    content: text,
    source,
    sourceLabel: sourceNode.dataset.excerptLabel || source
  };
}

function getClosestElement(node: Node | null) {
  if (!node) {
    return null;
  }

  if (node instanceof Element) {
    return node;
  }

  return node.parentElement;
}
