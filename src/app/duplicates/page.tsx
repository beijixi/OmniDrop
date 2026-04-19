import Link from "next/link";

import { DuplicateGroupCard } from "@/components/duplicate-group-card";
import type { DuplicateKind } from "@/lib/dedupe";
import { listDuplicateGroups } from "@/lib/entries";
import { getServerI18n } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DuplicateGroupsPageProps = {
  searchParams?: {
    kind?: string;
  };
};

const duplicateKindFilters = ["all", "asset", "url", "text"] as const;

type DuplicateKindFilter = (typeof duplicateKindFilters)[number];

export default async function DuplicateGroupsPage({ searchParams }: DuplicateGroupsPageProps) {
  const { locale } = getServerI18n();
  const activeKind = normalizeDuplicateKindFilter(searchParams?.kind);
  const allGroups = await listDuplicateGroups();
  const visibleGroups =
    activeKind === "all" ? allGroups : allGroups.filter((group) => group.kind === activeKind);
  const kindCounts = {
    all: allGroups.length,
    asset: allGroups.filter((group) => group.kind === "asset").length,
    text: allGroups.filter((group) => group.kind === "text").length,
    url: allGroups.filter((group) => group.kind === "url").length
  };
  const duplicateEntryCount = visibleGroups.reduce((sum, group) => sum + group.count, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
          {t(locale, "duplicates.eyebrow")}
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {t(locale, "duplicates.title")}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-500">
              {t(locale, "duplicates.subtitle")}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/80 bg-white/86 px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
          >
            {t(locale, "duplicates.open_home")}
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="panel px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {t(locale, "duplicates.summary_groups")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{visibleGroups.length}</p>
        </div>
        <div className="panel px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {t(locale, "duplicates.summary_items")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{duplicateEntryCount}</p>
        </div>
      </section>

      <section className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
        {duplicateKindFilters.map((kind) => {
          const active = activeKind === kind;
          const href = kind === "all" ? "/duplicates" : `/duplicates?kind=${kind}`;
          const count = kindCounts[kind];

          return (
            <Link
              key={kind}
              href={href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                active
                  ? "border-transparent bg-[linear-gradient(135deg,#0f172a,#0f766e_55%,#38bdf8)] text-white shadow-[0_12px_26px_rgba(20,184,166,0.18)]"
                  : "border-white/78 bg-white/78 text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
              )}
            >
              {getDuplicateFilterLabel(locale, kind)} · {count}
            </Link>
          );
        })}
      </section>

      {visibleGroups.length > 0 ? (
        <section className="space-y-4">
          {visibleGroups.map((group) => (
            <DuplicateGroupCard key={group.id} group={group} locale={locale} />
          ))}
        </section>
      ) : (
        <section className="panel-strong px-6 py-14 text-center">
          <div className="mx-auto max-w-2xl">
            <p className="text-xl font-semibold text-slate-900">{t(locale, "duplicates.empty_title")}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{t(locale, "duplicates.empty_description")}</p>
          </div>
        </section>
      )}
    </div>
  );
}

function normalizeDuplicateKindFilter(input?: string): DuplicateKindFilter {
  return duplicateKindFilters.includes(input as DuplicateKindFilter) ? (input as DuplicateKindFilter) : "all";
}

function getDuplicateFilterLabel(locale: ReturnType<typeof getServerI18n>["locale"], kind: DuplicateKindFilter) {
  if (kind === "asset") {
    return t(locale, "duplicates.filter_asset");
  }

  if (kind === "url") {
    return t(locale, "duplicates.filter_url");
  }

  if (kind === "text") {
    return t(locale, "duplicates.filter_text");
  }

  return t(locale, "duplicates.filter_all");
}
