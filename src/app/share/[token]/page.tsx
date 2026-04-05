import { notFound } from "next/navigation";

import { EntryCard } from "@/components/entry-card";
import { getSharedEntry } from "@/lib/entries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type SharePageProps = {
  params: {
    token: string;
  };
};

export default async function SharePage({ params }: SharePageProps) {
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
        <p className="text-sm font-semibold text-slate-900">{settings.appName} 分享内容</p>
        <p className="mt-1 text-sm text-slate-500">
          这是一个公开分享视图，内容保留原始发送来源和时间。
        </p>
      </section>

      <EntryCard entry={entry} publicView shareBaseUrl={settings.shareBaseUrl} />
    </div>
  );
}
