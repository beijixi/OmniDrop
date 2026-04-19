import Link from "next/link";

import { CollectionCreatePanel } from "@/components/collection-create-panel";
import { getCollectionSummaries } from "@/lib/collections";
import { t } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const { locale } = getServerI18n();
  const collections = await getCollectionSummaries();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
          {t(locale, "collections.eyebrow")}
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {t(locale, "collections.title")}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-500">
            {t(locale, "collections.subtitle")}
          </p>
        </div>
      </section>

      <CollectionCreatePanel />

      {collections.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="panel group block px-5 py-4 transition hover:-translate-y-[1px] hover:border-cyan-200/90"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-900 transition group-hover:text-cyan-700">
                    {collection.title}
                  </h2>
                  {collection.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-500">
                      {collection.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      {t(locale, "collections.no_description")}
                    </p>
                  )}
                </div>
                {collection.hasActiveShare ? (
                  <span className="rounded-full border border-emerald-100/90 bg-emerald-50/85 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    {t(locale, "collections.shared")}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{t(locale, "collections.entry_count", { count: collection.entryCount })}</span>
                <span>·</span>
                <span>{formatDateTime(collection.updatedAt, locale)}</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="panel-strong px-6 py-14 text-center">
          <div className="mx-auto max-w-2xl">
            <p className="text-xl font-semibold text-slate-900">{t(locale, "collections.empty_title")}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{t(locale, "collections.empty_description")}</p>
          </div>
        </section>
      )}
    </div>
  );
}
