"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

import { useI18n } from "@/components/i18n-provider";
import { entryViewOptions, type EntryView } from "@/lib/entry-views";
import { entryTypeOptions } from "@/lib/file-types";
import { cn } from "@/lib/utils";

type TimelineToolbarProps = {
  currentQuery?: string;
  currentType?: string;
  currentView?: EntryView;
  resultCount: number;
};

export function TimelineToolbar({
  currentQuery,
  currentType,
  currentView = "ACTIVE",
  resultCount
}: TimelineToolbarProps) {
  const { entryTypeLabels, entryViewLabels, t } = useI18n();
  const hasActiveFilters =
    Boolean(currentQuery) || (currentType || "ALL") !== "ALL" || currentView !== "ACTIVE";
  const [isOpen, setIsOpen] = useState(hasActiveFilters);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("header-extras"));
  }, []);

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

              <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
                {entryViewOptions.map((view) => {
                  const active = currentView === view;

                  return (
                    <Link
                      key={view}
                      href={buildHref({
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
              </div>

              <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
                {entryTypeOptions.map((type) => {
                  const active = (currentType || "ALL") === type;

                  return (
                    <Link
                      key={type}
                      href={buildHref({
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
}

function buildHref(input: { q?: string; type?: string; view?: EntryView }): string {
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

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path strokeLinecap="round" d="m16 16 4.2 4.2" />
    </svg>
  );
}
