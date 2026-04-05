import { Composer } from "@/components/composer";
import { EntryCard } from "@/components/entry-card";
import { TimelineToolbar } from "@/components/timeline-toolbar";
import { getEntries } from "@/lib/entries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: {
    q?: string;
    type?: string;
  };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const currentQuery = searchParams?.q?.trim() || "";
  const currentType = searchParams?.type?.trim() || "ALL";

  const [settings, entries] = await Promise.all([
    getSettings(),
    getEntries({
      q: currentQuery,
      type: currentType
    })
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <TimelineToolbar
        currentQuery={currentQuery}
        currentType={currentType}
        resultCount={entries.length}
      />

      <div className="relative space-y-4 pb-28 sm:pb-32">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} shareBaseUrl={settings.shareBaseUrl} />
          ))
        ) : (
          <div className="panel-strong relative overflow-hidden px-6 py-14 text-center">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),rgba(59,130,246,0)_62%)]" />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18),rgba(20,184,166,0)_70%)] blur-2xl" />
            <div className="spotlight-ring mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#0f172a,#0f766e_52%,#38bdf8)] text-lg font-semibold text-white">
              O
            </div>
            <p className="text-lg font-semibold text-slate-900">这里会像聊天一样持续流动</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500">
              直接从底部发送文本、图片、视频、PDF 或任意文件，内容会立刻出现在时间线上。
            </p>
          </div>
        )}
      </div>

      <Composer />
    </div>
  );
}
