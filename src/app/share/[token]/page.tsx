import { notFound } from "next/navigation";

import { EntryCard } from "@/components/entry-card";
import { getSharedEntry } from "@/lib/entries";
import { getServerI18n } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type SharePageProps = {
  params: {
    token: string;
  };
};

export default async function SharePage({ params }: SharePageProps) {
  const { locale } = getServerI18n();
  const [settings, entry] = await Promise.all([
    getSettings(),
    getSharedEntry(params.token)
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="panel px-5 py-4 sm:px-6">
        <p className="text-sm font-semibold text-slate-900">
          {t(locale, "share.title", { appName: settings.appName })}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {t(locale, "share.description")}
        </p>
      </section>

      <EntryCard
        entry={entry}
        locale={locale}
        publicView
      />
    </div>
  );
}
