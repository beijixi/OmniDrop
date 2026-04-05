"use client";

import { useState } from "react";
import Link from "next/link";

import { entryTypeLabels, entryTypeOptions } from "@/lib/file-types";
import { cn } from "@/lib/utils";

type TimelineToolbarProps = {
  currentQuery?: string;
  currentType?: string;
  resultCount: number;
};

export function TimelineToolbar({
  currentQuery,
  currentType,
  resultCount
}: TimelineToolbarProps) {
  const hasActiveFilters = Boolean(currentQuery) || (currentType || "ALL") !== "ALL";
  const [isOpen, setIsOpen] = useState(hasActiveFilters);

  return (
    <section className="sticky top-[4.35rem] z-20 mb-4 sm:top-[5.3rem]">
      <div className="panel relative overflow-hidden px-2.5 py-2.5 sm:px-3 sm:py-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(90deg,rgba(59,130,246,0),rgba(59,130,246,0.12),rgba(20,184,166,0.12),rgba(59,130,246,0))]" />

        <div className="relative flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/72 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <span className="h-2 w-2 rounded-full bg-[linear-gradient(135deg,#14b8a6,#38bdf8)] shadow-[0_0_14px_rgba(20,184,166,0.45)]" />
                时间流
              </span>
              <span className="inline-flex items-center rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,247,251,0.76))] px-3 py-1.5 text-xs text-slate-500">
                {resultCount} 条
              </span>
              {currentQuery ? (
                <span className="max-w-[11rem] truncate rounded-full border border-cyan-100/80 bg-cyan-50/80 px-3 py-1.5 text-xs text-cyan-700">
                  {currentQuery}
                </span>
              ) : null}
              {(currentType || "ALL") !== "ALL" ? (
                <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1.5 text-xs text-slate-600">
                  {entryTypeLabels[(currentType || "ALL") as keyof typeof entryTypeLabels]}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters ? (
              <Link
                href="/"
                className="hidden rounded-full border border-white/75 bg-white/82 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-900 sm:inline-flex"
              >
                清空
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/75 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,118,110,0.9),rgba(59,130,246,0.82))] px-3 text-xs font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] transition hover:-translate-y-[1px]"
            >
              <SearchIcon />
              <span className="hidden sm:inline">{isOpen ? "收起" : "搜索"}</span>
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="relative mt-3 space-y-3 border-t border-white/70 pt-3">
            <form action="/" className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {currentType && currentType !== "ALL" ? (
                <input type="hidden" name="type" value={currentType} />
              ) : null}

              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  name="q"
                  defaultValue={currentQuery}
                  placeholder="搜内容、文件名、发送人或设备"
                  className="h-12 w-full rounded-[20px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.9))] pl-11 pr-4 text-sm text-slate-800 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_26px_rgba(15,23,42,0.05)] transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <button
                type="submit"
                className="h-12 rounded-[20px] bg-[linear-gradient(135deg,#0f172a,#0f766e_58%,#38bdf8)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)] transition hover:-translate-y-[1px]"
              >
                搜索
              </button>
            </form>

            <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
              {entryTypeOptions.map((type) => {
                const active = (currentType || "ALL") === type;

                return (
                  <Link
                    key={type}
                    href={buildHref({
                      q: currentQuery,
                      type
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

              {hasActiveFilters ? (
                <Link
                  href="/"
                  className="shrink-0 rounded-full border border-rose-100/90 bg-rose-50/80 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:border-rose-200"
                >
                  清空条件
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function buildHref(input: { q?: string; type?: string }): string {
  const params = new URLSearchParams();

  if (input.q) {
    params.set("q", input.q);
  }

  if (input.type && input.type !== "ALL") {
    params.set("type", input.type);
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
