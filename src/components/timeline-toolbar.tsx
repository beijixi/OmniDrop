"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { useI18n } from "@/components/i18n-provider";
import { entryViewOptions, type EntryView } from "@/lib/entry-views";
import { entryTypeOptions } from "@/lib/file-types";
import type { MessageKey } from "@/lib/i18n";
import type { SavedViewSummary } from "@/lib/saved-views";
import { cn } from "@/lib/utils";

type TimelineToolbarProps = {
  currentDuplicatesOnly?: boolean;
  currentQuery?: string;
  currentType?: string;
  currentView?: EntryView;
  resultCount: number;
  savedViews: SavedViewSummary[];
};

export function TimelineToolbar({
  currentDuplicatesOnly = false,
  currentQuery,
  currentType,
  currentView = "ACTIVE",
  resultCount,
  savedViews
}: TimelineToolbarProps) {
  const router = useRouter();
  const { entryTypeLabels, entryViewLabels, t } = useI18n();
  const hasActiveFilters =
    Boolean(currentQuery) ||
    (currentType || "ALL") !== "ALL" ||
    currentView !== "ACTIVE" ||
    currentDuplicatesOnly;
  const [isOpen, setIsOpen] = useState(hasActiveFilters);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isSavingView, setIsSavingView] = useState(false);
  const [isSavingViewRequest, setIsSavingViewRequest] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");
  const [viewActionError, setViewActionError] = useState<string | null>(null);
  const [deletingViewId, setDeletingViewId] = useState<string | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("header-extras"));
  }, []);

  useEffect(() => {
    if (!isSavingView) {
      return;
    }

    setSaveViewName((current) => current || suggestSavedViewName({
      currentDuplicatesOnly,
      currentQuery,
      currentType,
      currentView,
      entryTypeLabels,
      entryViewLabels,
      t
    }));
  }, [
    currentDuplicatesOnly,
    currentQuery,
    currentType,
    currentView,
    entryTypeLabels,
    entryViewLabels,
    isSavingView,
    t
  ]);

  const controls = (
    <div className="flex items-center gap-2">
      <span className="glass-button hidden h-10 items-center justify-center rounded-full px-3 text-xs font-semibold text-slate-700 sm:inline-flex">
        <span className="hidden sm:inline">{t("toolbar.count", { count: resultCount })}</span>
      </span>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={cn(
          "relative inline-flex h-9 items-center justify-center gap-2 rounded-full border px-2.5 text-[11px] font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] transition hover:-translate-y-[1px] sm:h-10 sm:px-3 sm:text-xs",
          hasActiveFilters || isOpen
            ? "border-cyan-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,118,110,0.95),rgba(56,189,248,0.88))]"
            : "border-white/75 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,41,59,0.88),rgba(59,130,246,0.72))]"
        )}
        aria-expanded={isOpen}
        aria-label={t("toolbar.search")}
      >
        <SearchIcon />
        <span className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full border border-white/70 bg-white px-1 py-0.5 text-[10px] font-bold leading-none text-slate-800 shadow-[0_10px_18px_rgba(15,23,42,0.12)] sm:hidden">
          {resultCount > 99 ? "99+" : resultCount}
        </span>
        <span className="hidden sm:inline">{t("toolbar.search")}</span>
      </button>
    </div>
  );

  const activeSavedViewId = savedViews.find((savedView) =>
    isSavedViewActive(savedView, {
      currentDuplicatesOnly,
      currentQuery,
      currentType,
      currentView
    })
  )?.id;

  return (
    <>
      {portalTarget ? createPortal(controls, portalTarget) : null}

      {isOpen ? (
        <section className="sticky top-[4.45rem] z-20 mb-4 sm:top-[5.35rem]">
          <div className="panel relative overflow-hidden px-3 py-3 sm:px-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(90deg,rgba(59,130,246,0),rgba(59,130,246,0.12),rgba(20,184,166,0.12),rgba(59,130,246,0))]" />

            <div className="relative space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/72 px-3 py-1.5 font-semibold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <span className="h-2 w-2 rounded-full bg-[linear-gradient(135deg,#14b8a6,#38bdf8)] shadow-[0_0_14px_rgba(20,184,166,0.45)]" />
                  {t("toolbar.stream")}
                </span>
                {currentQuery ? (
                  <span className="max-w-[11rem] truncate rounded-full border border-cyan-100/80 bg-cyan-50/80 px-3 py-1.5 text-cyan-700">
                    {currentQuery}
                  </span>
                ) : null}
                {(currentType || "ALL") !== "ALL" ? (
                  <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1.5 text-slate-600">
                    {entryTypeLabels[(currentType || "ALL") as keyof typeof entryTypeLabels]}
                  </span>
                ) : null}
                {currentView !== "ACTIVE" ? (
                  <span className="rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1.5 text-amber-700">
                    {entryViewLabels[currentView]}
                  </span>
                ) : null}
                {currentDuplicatesOnly ? (
                  <span className="rounded-full border border-rose-200/80 bg-rose-50/80 px-3 py-1.5 text-rose-700">
                    {t("toolbar.only_duplicates")}
                  </span>
                ) : null}
                {hasActiveFilters ? (
                  <Link
                    href="/"
                    className="rounded-full border border-rose-100/90 bg-rose-50/80 px-3 py-1.5 font-medium text-rose-600 transition hover:border-rose-200"
                  >
                    {t("toolbar.clear_filters")}
                  </Link>
                ) : null}
              </div>

              <form action="/" className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {currentType && currentType !== "ALL" ? (
                  <input type="hidden" name="type" value={currentType} />
                ) : null}
                {currentView !== "ACTIVE" ? (
                  <input type="hidden" name="view" value={currentView} />
                ) : null}
                {currentDuplicatesOnly ? <input type="hidden" name="duplicates" value="1" /> : null}

                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    name="q"
                    defaultValue={currentQuery}
                    placeholder={t("toolbar.search_placeholder")}
                    className="h-12 w-full rounded-[20px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.9))] pl-11 pr-4 text-sm text-slate-800 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_26px_rgba(15,23,42,0.05)] transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
                  />
                </div>

                <button
                  type="submit"
                  className="h-12 rounded-[20px] bg-[linear-gradient(135deg,#0f172a,#0f766e_58%,#38bdf8)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)] transition hover:-translate-y-[1px]"
                >
                  {t("toolbar.search")}
                </button>
              </form>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {t("toolbar.saved_views")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSavingView((value) => !value);
                      setSaveViewName("");
                      setViewActionError(null);
                    }}
                    disabled={!hasActiveFilters}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      hasActiveFilters
                        ? "border-cyan-200/80 bg-cyan-50/80 text-cyan-700 hover:border-cyan-300"
                        : "cursor-not-allowed border-slate-200/80 bg-slate-50/80 text-slate-400"
                    )}
                  >
                    {t("toolbar.save_view")}
                  </button>
                </div>

                {isSavingView ? (
                  <form
                    className="flex flex-col gap-2 rounded-[18px] border border-white/75 bg-white/70 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center"
                    onSubmit={(event) => void handleSaveView(event)}
                  >
                    <input
                      value={saveViewName}
                      onChange={(event) => setSaveViewName(event.target.value)}
                      placeholder={t("toolbar.save_view_placeholder")}
                      className="h-11 flex-1 rounded-[16px] border border-slate-200/80 bg-white/90 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSavingViewRequest}
                        className="h-11 rounded-[16px] bg-[linear-gradient(135deg,#0f172a,#0f766e_58%,#38bdf8)] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)] transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70"
                      >
                        {t("toolbar.save_view_confirm")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSavingView(false);
                          setSaveViewName("");
                          setViewActionError(null);
                        }}
                        className="h-11 rounded-[16px] border border-slate-200/80 bg-white/88 px-4 text-sm font-medium text-slate-600 transition hover:border-slate-300"
                      >
                        {t("toolbar.save_view_cancel")}
                      </button>
                    </div>
                  </form>
                ) : null}

                {savedViews.length > 0 ? (
                  <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
                    {savedViews.map((savedView) => {
                      const active = savedView.id === activeSavedViewId;
                      const deleting = deletingViewId === savedView.id;

                      return (
                        <div
                          key={savedView.id}
                          className={cn(
                            "flex shrink-0 items-center overflow-hidden rounded-full border shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
                            active
                              ? "border-transparent bg-[linear-gradient(135deg,#0f172a,#0f766e_55%,#38bdf8)] text-white"
                              : "border-white/78 bg-white/76 text-slate-600"
                          )}
                        >
                          <Link
                            href={buildHref({
                              duplicatesOnly: savedView.duplicatesOnly,
                              q: savedView.query,
                              type: savedView.entryType,
                              view: savedView.entryView
                            })}
                            className={cn(
                              "px-3 py-1.5 text-sm font-medium",
                              active ? "text-white" : "hover:text-cyan-700"
                            )}
                          >
                            {savedView.name}
                          </Link>
                          <button
                            type="button"
                            aria-label={t("toolbar.delete_view")}
                            disabled={deleting}
                            onClick={() => void handleDeleteSavedView(savedView.id)}
                            className={cn(
                              "border-l px-2.5 py-1.5 text-xs transition",
                              active
                                ? "border-white/15 text-white/80 hover:text-white"
                                : "border-slate-200/80 text-slate-400 hover:text-rose-600"
                            )}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {viewActionError ? <p className="text-sm text-rose-600">{viewActionError}</p> : null}
              </div>

              <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
                {entryViewOptions.map((view) => {
                  const active = currentView === view;

                  return (
                    <Link
                      key={view}
                      href={buildHref({
                        duplicatesOnly: currentDuplicatesOnly,
                        q: currentQuery,
                        type: currentType,
                        view
                      })}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        active
                          ? "border-transparent bg-[linear-gradient(135deg,#f59e0b,#ea580c_58%,#ef4444)] text-white shadow-[0_12px_26px_rgba(245,158,11,0.22)]"
                          : "border-white/78 bg-white/74 text-slate-600 hover:border-amber-200 hover:text-amber-700"
                      )}
                    >
                      {entryViewLabels[view]}
                    </Link>
                  );
                })}

                <Link
                  href={buildHref({
                    duplicatesOnly: !currentDuplicatesOnly,
                    q: currentQuery,
                    type: currentType,
                    view: currentView
                  })}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                    currentDuplicatesOnly
                      ? "border-transparent bg-[linear-gradient(135deg,#ef4444,#ec4899_58%,#f59e0b)] text-white shadow-[0_12px_26px_rgba(239,68,68,0.2)]"
                      : "border-white/78 bg-white/74 text-slate-600 hover:border-rose-200 hover:text-rose-700"
                  )}
                >
                  {t("toolbar.only_duplicates")}
                </Link>
              </div>

              <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
                {entryTypeOptions.map((type) => {
                  const active = (currentType || "ALL") === type;

                  return (
                    <Link
                      key={type}
                      href={buildHref({
                        duplicatesOnly: currentDuplicatesOnly,
                        q: currentQuery,
                        type,
                        view: currentView
                      })}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        active
                          ? "border-transparent bg-[linear-gradient(135deg,#0f172a,#0f766e_55%,#38bdf8)] text-white shadow-[0_12px_26px_rgba(20,184,166,0.2)]"
                          : "border-white/78 bg-white/74 text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
                      )}
                    >
                      {entryTypeLabels[type]}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );

  async function handleSaveView(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!saveViewName.trim()) {
      setViewActionError(t("toolbar.save_view_name_required"));
      return;
    }

    setIsSavingViewRequest(true);
    setViewActionError(null);

    try {
      const response = await fetch("/api/v1/saved-views", {
        body: JSON.stringify({
          duplicatesOnly: currentDuplicatesOnly,
          name: saveViewName.trim(),
          q: currentQuery || "",
          type: currentType || "ALL",
          view: currentView
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(payload?.error?.message || t("toolbar.save_view_failed"));
      }

      setIsSavingView(false);
      setSaveViewName("");
      router.refresh();
    } catch (error) {
      setViewActionError(error instanceof Error ? error.message : t("toolbar.save_view_failed"));
    } finally {
      setIsSavingViewRequest(false);
    }
  }

  async function handleDeleteSavedView(id: string) {
    if (!window.confirm(t("toolbar.confirm_delete_view"))) {
      return;
    }

    setDeletingViewId(id);
    setViewActionError(null);

    try {
      const response = await fetch(`/api/v1/saved-views/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(payload?.error?.message || t("toolbar.delete_view_failed"));
      }

      router.refresh();
    } catch (error) {
      setViewActionError(error instanceof Error ? error.message : t("toolbar.delete_view_failed"));
    } finally {
      setDeletingViewId(null);
    }
  }
}

function buildHref(input: {
  duplicatesOnly?: boolean;
  q?: string;
  type?: string;
  view?: EntryView;
}): string {
  const params = new URLSearchParams();

  if (input.q) {
    params.set("q", input.q);
  }

  if (input.type && input.type !== "ALL") {
    params.set("type", input.type);
  }

  if (input.view && input.view !== "ACTIVE") {
    params.set("view", input.view);
  }

  if (input.duplicatesOnly) {
    params.set("duplicates", "1");
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function isSavedViewActive(
  savedView: SavedViewSummary,
  current: {
    currentDuplicatesOnly: boolean;
    currentQuery?: string;
    currentType?: string;
    currentView: EntryView;
  }
) {
  return (
    savedView.duplicatesOnly === current.currentDuplicatesOnly &&
    savedView.query === (current.currentQuery || "") &&
    savedView.entryType === (current.currentType || "ALL") &&
    savedView.entryView === current.currentView
  );
}

function suggestSavedViewName(input: {
  currentDuplicatesOnly: boolean;
  currentQuery?: string;
  currentType?: string;
  currentView: EntryView;
  entryTypeLabels: Record<string, string>;
  entryViewLabels: Record<EntryView, string>;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}) {
  const parts: string[] = [];

  if (input.currentQuery) {
    parts.push(input.currentQuery);
  }

  if ((input.currentType || "ALL") !== "ALL") {
    parts.push(input.entryTypeLabels[input.currentType || "ALL"]);
  }

  if (input.currentView !== "ACTIVE") {
    parts.push(input.entryViewLabels[input.currentView]);
  }

  if (input.currentDuplicatesOnly) {
    parts.push(input.t("toolbar.only_duplicates"));
  }

  return parts.length > 0 ? parts.join(" · ") : input.t("toolbar.save_view");
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path strokeLinecap="round" d="m16 16 4.2 4.2" />
    </svg>
  );
}
