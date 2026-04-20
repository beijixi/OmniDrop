import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { EntryCard } from "@/components/entry-card";
import { getSharedCollection } from "@/lib/collections";
import { t } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n-server";
import { getSettings } from "@/lib/settings";
import { formatDateTime, isMobileUserAgent } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CollectionSharePageProps = {
  params: {
    token: string;
  };
};

export default async function CollectionSharePage({ params }: CollectionSharePageProps) {
  const { locale } = getServerI18n();
  const preferPdfInlinePreview = !isMobileUserAgent(headers().get("user-agent"));
  const [settings, collection] = await Promise.all([
    getSettings(),
    getSharedCollection(params.token)
  ]);

  if (!collection) {
    notFound();
  }

  const firstLinkedCover = collection.entries.find((item) => item.entry.linkImageUrl)?.entry.linkImageUrl;
  const firstImageAsset = collection.entries
    .flatMap((item) => item.entry.assets)
    .find((asset) => asset.kind === "IMAGE");
  const coverImageUrl =
    firstLinkedCover ||
    (firstImageAsset ? `/api/share/collections/${params.token}/assets/${firstImageAsset.id}` : null);
  const entryCount = collection.entries.length;
  const linkCount = collection.entries.filter((item) => Boolean(item.entry.canonicalUrl)).length;
  const assetCount = collection.entries.reduce((sum, item) => sum + item.entry.assets.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="panel relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
        {coverImageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${coverImageUrl})` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.08),rgba(8,145,178,0.06),rgba(255,255,255,0.4))]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_38%)]" />
        )}

        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            {t(locale, "share.collection_eyebrow", {
              appName: settings.appName
            })}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.3rem]">
            {collection.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
            {collection.description || t(locale, "share.collection_description")}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
            <span className="rounded-full border border-white/85 bg-white/82 px-3 py-1.5 font-medium shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              {t(locale, "share.collection_items", { count: entryCount })}
            </span>
            <span className="rounded-full border border-white/85 bg-white/82 px-3 py-1.5 font-medium shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              {t(locale, "share.collection_links", { count: linkCount })}
            </span>
            <span className="rounded-full border border-white/85 bg-white/82 px-3 py-1.5 font-medium shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              {t(locale, "share.collection_assets", { count: assetCount })}
            </span>
            <span className="rounded-full border border-white/85 bg-white/82 px-3 py-1.5 font-medium shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              {t(locale, "share.collection_updated", {
                updatedAt: formatDateTime(collection.updatedAt, locale)
              })}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-5 pb-12 sm:space-y-6">
        {collection.entries.map((item) => (
          <EntryCard
            key={`${collection.id}-${item.entryId}`}
            entry={item.entry}
            locale={locale}
            preferPdfInlinePreview={preferPdfInlinePreview}
            publicAssetBasePath={`/api/share/collections/${params.token}/assets`}
            publicView
          />
        ))}
      </section>
    </div>
  );
}
