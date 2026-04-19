import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CollectionActions } from "@/components/collection-actions";
import { CollectionEntryControls } from "@/components/collection-entry-controls";
import { EntryCard } from "@/components/entry-card";
import { getCollectionById } from "@/lib/collections";
import { t } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n-server";
import { resolveViewerIpv4FromHeaders } from "@/lib/request-source";
import { formatDateTime, isMobileUserAgent } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: {
    id: string;
  };
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const requestHeaders = headers();
  const { locale } = getServerI18n();
  const collection = await getCollectionById(params.id);

  if (!collection) {
    notFound();
  }

  const preferPdfInlinePreview = !isMobileUserAgent(requestHeaders.get("user-agent"));
  const viewerIp = resolveViewerIpv4FromHeaders(requestHeaders);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="space-y-3">
        <Link
          href="/collections"
          className="inline-flex items-center rounded-full border border-white/80 bg-white/86 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          {t(locale, "collections.back_to_all")}
        </Link>
        <div className="panel px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
                {t(locale, "collections.eyebrow")}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {collection.title}
              </h1>
              <p className="text-sm leading-7 text-slate-500">
                {collection.description || t(locale, "collections.no_description")}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{t(locale, "collections.entry_count", { count: collection.entries.length })}</span>
                <span>·</span>
                <span>{formatDateTime(collection.updatedAt, locale)}</span>
              </div>
            </div>

            <div className="w-full max-w-xl">
              <CollectionActions
                collectionId={collection.id}
                hasActiveShare={Boolean(collection.shareLink && !collection.shareLink.revokedAt)}
                initialDescription={collection.description}
                initialTitle={collection.title}
              />
            </div>
          </div>
        </div>
      </section>

      {collection.entries.length > 0 ? (
        <section className="space-y-5 pb-12 sm:space-y-6">
          {collection.entries.map((item, index) => (
            <CollectionEntryControls
              key={`${collection.id}-${item.entryId}`}
              canMoveDown={index < collection.entries.length - 1}
              canMoveUp={index > 0}
              collectionId={collection.id}
              entryId={item.entryId}
            >
              <EntryCard
                entry={item.entry}
                locale={locale}
                preferPdfInlinePreview={preferPdfInlinePreview}
                viewerIp={viewerIp}
              />
            </CollectionEntryControls>
          ))}
        </section>
      ) : (
        <section className="panel-strong px-6 py-14 text-center">
          <div className="mx-auto max-w-2xl">
            <p className="text-xl font-semibold text-slate-900">{t(locale, "collections.empty_items_title")}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{t(locale, "collections.empty_items_description")}</p>
          </div>
        </section>
      )}
    </div>
  );
}
