import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { EntryActions } from "@/components/entry-actions";
import { ReaderStateSync } from "@/components/reader-state-sync";
import { getAssetPreview } from "@/lib/asset-previews";
import { getEntryById } from "@/lib/entries";
import { getFileVisual } from "@/lib/file-types";
import { t } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n-server";
import type { ReadingState } from "@/lib/reading-states";
import { formatBytes, formatDateTime, isMobileUserAgent } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ReaderPageProps = {
  params: {
    id: string;
  };
};

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { locale } = getServerI18n();
  const preferPdfInlinePreview = !isMobileUserAgent(headers().get("user-agent"));
  const entry = await getEntryById(params.id);

  if (!entry) {
    notFound();
  }

  const filePreviews = await Promise.all(
    entry.assets.map(async (asset) => ({
      asset,
      preview: asset.kind === "FILE" ? await getAssetPreview(asset) : null,
      visual: getFileVisual(asset.originalName, asset.mimeType)
    }))
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <ReaderStateSync entryId={entry.id} readingState={entry.readingState as ReadingState} />

      <section className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-white/80 bg-white/86 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          {t(locale, "reader.back_home")}
        </Link>

        <div className="panel relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_38%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
                {t(locale, "reader.eyebrow")}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {entry.linkTitle || entry.assets[0]?.originalName || entry.message?.slice(0, 48) || t(locale, "reader.title")}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{formatDateTime(entry.createdAt, locale)}</span>
                <span>·</span>
                <span>{getReadingStateLabel(locale, entry.readingState as ReadingState)}</span>
                {entry.senderName ? (
                  <>
                    <span>·</span>
                    <span>{entry.senderName}</span>
                  </>
                ) : null}
              </div>
              {entry.linkDescription ? (
                <p className="max-w-3xl text-sm leading-7 text-slate-600">{entry.linkDescription}</p>
              ) : null}
              {entry.note ? (
                <div className="max-w-3xl rounded-[18px] border border-amber-100/90 bg-amber-50/84 px-4 py-3 text-sm leading-7 text-slate-700">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                    {t(locale, "entry.note")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words">{entry.note}</p>
                </div>
              ) : null}
            </div>

            <div className="w-full max-w-md">
              <div className="rounded-[22px] border border-white/80 bg-white/78 p-3 shadow-[0_14px_28px_rgba(15,23,42,0.06)]">
                <EntryActions
                  entryId={entry.id}
                  hasActiveShare={Boolean(entry.shareLink && !entry.shareLink.revokedAt)}
                  isArchived={Boolean(entry.archivedAt)}
                  isFavorite={entry.isFavorite}
                  isPinned={Boolean(entry.pinnedAt)}
                  linkUrl={entry.canonicalUrl}
                  messageText={entry.message}
                  note={entry.note}
                  readingState={entry.readingState as ReadingState}
                  tags={entry.tags.map((item) => item.tag.name)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.canonicalUrl ? (
                    <a
                      href={entry.canonicalUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-full border border-cyan-100/90 bg-cyan-50/85 px-3 py-1.5 text-sm font-medium text-cyan-700 transition hover:border-cyan-200"
                    >
                      {t(locale, "reader.open_original")}
                    </a>
                  ) : null}
                  {entry.assets[0] ? (
                    <a
                      href={`/api/v1/assets/${entry.assets[0].id}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-full border border-white/80 bg-white/88 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                    >
                      {t(locale, "entry.open")}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {entry.message ? (
        <section className="panel px-5 py-5 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {t(locale, "search.source_message")}
          </p>
          <div className="prose prose-slate mt-3 max-w-none whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-800">
            {entry.message}
          </div>
        </section>
      ) : null}

      {entry.canonicalUrl ? (
        <section className="panel overflow-hidden px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            {entry.linkImageUrl ? (
              <img
                src={entry.linkImageUrl}
                alt={entry.linkTitle || entry.canonicalUrl}
                className="h-52 w-full rounded-[24px] object-cover lg:h-64 lg:w-[18rem]"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {entry.linkSiteName ? <span>{entry.linkSiteName}</span> : null}
                {entry.linkPublishedAt ? (
                  <>
                    {entry.linkSiteName ? <span>·</span> : null}
                    <span>{formatDateTime(entry.linkPublishedAt, locale)}</span>
                  </>
                ) : null}
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {entry.linkTitle || entry.canonicalUrl}
              </h2>
              {entry.linkDescription ? (
                <p className="text-sm leading-7 text-slate-600">{entry.linkDescription}</p>
              ) : null}
              {entry.linkContentText ? (
                <div className="rounded-[22px] border border-slate-200/80 bg-white/82 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {t(locale, "reader.link_excerpt")}
                  </p>
                  <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                    {entry.linkContentText}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {filePreviews.map(({ asset, preview, visual }) => (
        <section key={`${entry.id}-${asset.id}`} className="panel overflow-hidden px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-900">{asset.originalName}</p>
              <p className="mt-1 text-sm text-slate-500">
                {asset.mimeType} · {formatBytes(asset.size)}
              </p>
            </div>
            <a
              href={`/api/v1/assets/${asset.id}`}
              target="_blank"
              rel="noreferrer noopener"
              className="shrink-0 rounded-full border border-white/80 bg-white/88 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
            >
              {t(locale, "entry.open")}
            </a>
          </div>

          {asset.kind === "IMAGE" ? (
            <img
              src={`/api/v1/assets/${asset.id}`}
              alt={asset.originalName}
              className="max-h-[42rem] w-full rounded-[24px] object-contain bg-white"
            />
          ) : null}

          {asset.kind === "VIDEO" ? (
            <video
              controls
              playsInline
              preload="metadata"
              className="max-h-[42rem] w-full rounded-[24px] bg-slate-950"
              src={`/api/v1/assets/${asset.id}`}
            />
          ) : null}

          {asset.kind === "PDF" ? (
            preferPdfInlinePreview ? (
              <iframe
                src={`/api/v1/assets/${asset.id}#toolbar=0&navpanes=0`}
                title={asset.originalName}
                className="h-[70vh] min-h-[34rem] w-full rounded-[24px] bg-slate-100"
              />
            ) : (
              <div className="rounded-[24px] border border-slate-200/80 bg-white/82 px-4 py-5 text-sm text-slate-600">
                {t(locale, "reader.pdf_mobile_hint")}
              </div>
            )
          ) : null}

          {asset.kind === "FILE" ? (
            preview ? (
              <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {preview.kind === "markdown" ? (
                  <article
                    className="prose prose-slate max-w-none px-5 py-5 [&_pre]:overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: preview.html }}
                  />
                ) : null}

                {preview.kind === "text" ? (
                  <pre className="scrollbar-thin overflow-x-auto px-5 py-5 text-sm leading-7 text-slate-700">
                    {preview.text}
                  </pre>
                ) : null}

                {preview.kind === "table" ? (
                  <div className="overflow-x-auto px-2 py-2">
                    <table className="min-w-full border-collapse text-sm text-slate-700">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/80">
                          {preview.columns.map((column) => (
                            <th
                              key={`${asset.id}-${column}`}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, rowIndex) => (
                          <tr key={`${asset.id}-${rowIndex}`} className="border-b border-slate-100/90 last:border-b-0">
                            {preview.columns.map((column, columnIndex) => (
                              <td
                                key={`${asset.id}-${column}-${columnIndex}`}
                                className="px-4 py-3 align-top text-sm text-slate-700"
                              >
                                {row[columnIndex] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[24px] border border-slate-200/80 bg-white/82 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-slate-700 to-slate-900 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
                    {visual.badge}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{asset.originalName}</p>
                    <p className="mt-1 text-xs text-slate-500">{visual.label}</p>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </section>
      ))}
    </div>
  );
}

function getReadingStateLabel(locale: ReturnType<typeof getServerI18n>["locale"], readingState: ReadingState) {
  switch (readingState) {
    case "LATER":
      return t(locale, "reading.state_later");
    case "READING":
      return t(locale, "reading.state_reading");
    case "DONE":
      return t(locale, "reading.state_done");
    default:
      return t(locale, "reading.state_inbox");
  }
}
