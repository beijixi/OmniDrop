import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { EntryCard } from "@/components/entry-card";
import { getSharedCollection } from "@/lib/collections";
import { t } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n-server";
import { getSettings } from "@/lib/settings";
import { isMobileUserAgent } from "@/lib/utils";

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

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="panel px-5 py-4 sm:px-6">
        <p className="text-sm font-semibold text-slate-900">
          {t(locale, "share.collection_title", {
            appName: settings.appName,
            title: collection.title
          })}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {collection.description || t(locale, "share.collection_description")}
        </p>
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
