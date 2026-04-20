import Link from "next/link";
import type { ReactNode } from "react";

import { CopyImageButton, CopyTextButton } from "@/components/clipboard-buttons";
import { EntryActions } from "@/components/entry-actions";
import { EntryExcerptList } from "@/components/entry-excerpt-list";
import { getAssetPreview } from "@/lib/asset-previews";
import type { AppLocale } from "@/lib/i18n";
import { getFileVisual } from "@/lib/file-types";
import type { EntrySearchSnippetSource, EntryWithRelations, TimelineEntry } from "@/lib/entries";
import { t } from "@/lib/i18n";
import type { ReadingState } from "@/lib/reading-states";
import { cn, extractFirstExternalUrl, formatBytes, formatDateTime, normalizeExternalUrl, isIpv4Address } from "@/lib/utils";

type EntryCardProps = {
  entry: EntryWithRelations & Partial<Pick<TimelineEntry, "duplicateSummary" | "searchMatch">>;
  locale: AppLocale;
  preferPdfInlinePreview?: boolean;
  publicAssetBasePath?: string | null;
  publicView?: boolean;
  searchQuery?: string;
  shareToken?: string | null;
  viewerIp?: string | null;
};

export async function EntryCard({
  entry,
  locale,
  preferPdfInlinePreview = true,
  publicAssetBasePath = null,
  publicView = false,
  searchQuery = "",
  shareToken = null,
  viewerIp = null
}: EntryCardProps) {
  const displaySenderName =
    entry.senderName === "current-device" || entry.senderName === "当前设备"
      ? t(locale, "entry.local_source")
      : entry.senderName;
  const assetBasePath =
    publicView
      ? publicAssetBasePath || (shareToken ? `/api/share/${shareToken}/assets` : "/api/v1/assets")
      : "/api/v1/assets";
  const assetPath = (assetId: string) => `${assetBasePath}/${assetId}`;
  const imageAssets = entry.assets.filter((asset) => asset.kind === "IMAGE");
  const nonImageAssets = entry.assets.filter((asset) => asset.kind !== "IMAGE");
  const visibleIp = isIpv4Address(entry.senderIp) ? entry.senderIp : null;
  const isCurrentDevice = !publicView && Boolean(visibleIp && viewerIp && visibleIp === viewerIp);
  const align = isCurrentDevice ? "right" : "left";
  const bubbleMaxWidth = "max-w-[min(82vw,34rem)] sm:max-w-[42rem]";
  const sourceLabel =
    entry.senderHost && visibleIp
      ? `${entry.senderHost} · ${visibleIp}`
      : entry.senderHost || visibleIp || t(locale, "entry.local_source");
  const copyableLink = entry.canonicalUrl || extractFirstExternalUrl(entry.message);
  const readHref = !publicView ? `/read/${entry.id}` : null;
  const linkFetchState = getLinkFetchState(locale, entry.linkFetchStatus, entry.linkFetchError);
  const filePreviews = await Promise.all(
    nonImageAssets.map(async (asset) => ({
      asset,
      preview: asset.kind === "FILE" ? await getAssetPreview(asset) : null,
      visual: getFileVisual(asset.originalName, asset.mimeType)
    }))
  );

  return (
    <article className="flex w-full">
      <div className="w-full max-w-[56rem]">
        <div
          className={cn(
            "flex items-end gap-2.5 sm:gap-4",
            align === "right" ? "flex-row-reverse" : "flex-row"
          )}
        >
          <div
            className={cn(
              "relative mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)] sm:h-10 sm:w-10 sm:text-sm",
              align === "right"
                ? "bg-[linear-gradient(135deg,#0ea5e9,#14b8a6_52%,#818cf8)]"
                : "bg-[linear-gradient(135deg,#0f172a,#334155_56%,#6366f1)]"
            )}
          >
            {displaySenderName.slice(0, 1).toUpperCase()}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>

          <div className={cn("min-w-0 flex flex-1 flex-col gap-1.5", align === "right" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "flex max-w-full items-center gap-2 px-1 text-[11px] sm:text-xs",
                align === "right" ? "flex-row-reverse text-right text-slate-500" : "text-left text-slate-500"
              )}
            >
              {!publicView ? (
                <EntryActions
                  inline
                  align={align}
                  duplicateCount={entry.duplicateSummary?.count || 0}
                  entryId={entry.id}
                  hasActiveShare={Boolean(entry.shareLink && !entry.shareLink.revokedAt)}
                  isArchived={Boolean(entry.archivedAt)}
                  isFavorite={entry.isFavorite}
                  isPinned={Boolean(entry.pinnedAt)}
                  linkUrl={copyableLink}
                  messageText={entry.message}
                  note={entry.note}
                  readingState={entry.readingState as ReadingState}
                  tags={entry.tags.map((item) => item.tag.name)}
                />
              ) : null}

              <div className="min-w-0">
                <div
                  className={cn(
                    "flex max-w-full items-center gap-2",
                    align === "right" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <span className="font-semibold text-slate-700">{displaySenderName}</span>
                  {entry.pinnedAt ? <EntryStateBadge label={t(locale, "entry.pinned")} tone="cyan" /> : null}
                  {entry.isFavorite ? <EntryStateBadge label={t(locale, "entry.favorite")} tone="amber" /> : null}
                  {entry.readingState !== "INBOX" ? (
                    <EntryStateBadge
                      label={getReadingStateLabel(locale, entry.readingState as ReadingState)}
                      tone={getReadingStateTone(entry.readingState as ReadingState)}
                    />
                  ) : null}
                  {entry.archivedAt ? <EntryStateBadge label={t(locale, "entry.archived")} tone="slate" /> : null}
                  {entry.duplicateSummary ? (
                    <EntryStateBadge
                      label={t(locale, "entry.duplicate", { count: entry.duplicateSummary.count })}
                      tone="rose"
                    />
                  ) : null}
                  <span>{formatDateTime(entry.createdAt, locale)}</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-slate-400 sm:text-xs">
                  {sourceLabel}
                  {entry.shareLink?.revokedAt ? (
                    <span className="text-rose-500"> · {t(locale, "entry.share_revoked")}</span>
                  ) : null}
                </div>
                {entry.tags.length > 0 ? (
                  <div
                    className={cn(
                      "mt-1 flex max-w-full flex-wrap gap-1.5",
                      align === "right" ? "justify-end" : "justify-start"
                    )}
                  >
                    {entry.tags.map((item) => (
                      <span
                        key={`${entry.id}-${item.tagId}`}
                        className="rounded-full border border-emerald-100/90 bg-emerald-50/85 px-2.5 py-1 text-[10px] font-medium text-emerald-700"
                      >
                        #{item.tag.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className={cn("relative w-full", bubbleMaxWidth)}>
              <span className={cn("message-tail", align === "right" ? "message-tail-right" : "message-tail-left")} />
              <div
                className={cn(
                  "message-shell bubble-shadow transition hover:-translate-y-[1px]",
                  align === "right" ? "message-shell-right" : "message-shell-left"
                )}
              >
                <div className={align === "right" ? "message-tint-right" : "message-tint-left"} />

                <div className="space-y-3 px-3.5 py-3 sm:space-y-4 sm:px-4 sm:py-4">
                  {entry.searchMatch && searchQuery ? (
                    <section
                      className={cn(
                        "rounded-[18px] border px-3.5 py-3 sm:px-4",
                        align === "right"
                          ? "border-white/15 bg-white/8 text-white/90"
                          : "border-cyan-100/80 bg-cyan-50/70 text-slate-700"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-[11px] font-semibold uppercase tracking-[0.08em]",
                            align === "right" ? "text-white/70" : "text-cyan-700"
                          )}
                        >
                          {t(locale, "search.matches")}
                        </span>
                        {entry.searchMatch.sources.map((source) => (
                          <span
                            key={`${entry.id}-${source}`}
                            className={cn(
                              "rounded-full border px-2 py-1 text-[10px] font-semibold",
                              align === "right"
                                ? "border-white/15 bg-white/8 text-white/80"
                                : "border-white/80 bg-white/85 text-slate-600"
                            )}
                          >
                            {getSearchSourceLabel(locale, source)}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 space-y-2">
                        {entry.searchMatch.snippets.map((snippet, index) => (
                          <div
                            key={`${entry.id}-snippet-${index}`}
                            className={cn(
                              "rounded-[16px] px-3 py-2.5",
                              align === "right" ? "bg-white/8" : "bg-white/85"
                            )}
                          >
                            <div
                              className={cn(
                                "mb-1 text-[11px] font-medium",
                                align === "right" ? "text-white/70" : "text-slate-500"
                              )}
                            >
                              {getSearchSourceLabel(locale, snippet.source)}
                              {snippet.assetName ? ` · ${snippet.assetName}` : ""}
                            </div>
                            <p
                              className={cn(
                                "whitespace-pre-wrap break-words text-sm leading-6",
                                align === "right" ? "text-white" : "text-slate-700"
                              )}
                            >
                              {renderHighlightedText(snippet.text, searchQuery, align)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {!entry.message && (copyableLink || readHref) ? (
                    <section>
                      <div className={cn("flex gap-2", align === "right" ? "justify-end" : "justify-start")}>
                        {readHref ? (
                          <Link
                            href={readHref}
                            className={cn(
                              "inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold transition",
                              align === "right"
                                ? "border-white/20 bg-white/10 text-white hover:border-white/35 hover:text-white"
                                : "border-slate-200/90 bg-white/88 text-slate-700 hover:border-cyan-200 hover:text-cyan-800"
                            )}
                          >
                            {t(locale, "entry.read")}
                          </Link>
                        ) : null}
                        {copyableLink ? (
                          <CopyTextButton
                            value={copyableLink}
                            idleLabel={t(locale, "actions.copy_link")}
                            copiedLabel={t(locale, "actions.link_copied")}
                            className={cn(
                              "h-8 w-8 shrink-0",
                              align === "right"
                                ? "border-white/20 bg-white/10 text-white hover:border-white/35 hover:text-white"
                                : "border-cyan-100/90 bg-white/88 text-cyan-700 hover:border-cyan-200 hover:text-cyan-800"
                            )}
                          />
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  {entry.message ? (
                    <section>
                      {copyableLink || readHref ? (
                        <div className={cn("mb-2 flex gap-2", align === "right" ? "justify-end" : "justify-start")}>
                          {readHref ? (
                            <Link
                              href={readHref}
                              className={cn(
                                "inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold transition",
                                align === "right"
                                  ? "border-white/20 bg-white/10 text-white hover:border-white/35 hover:text-white"
                                  : "border-slate-200/90 bg-white/88 text-slate-700 hover:border-cyan-200 hover:text-cyan-800"
                              )}
                            >
                              {t(locale, "entry.read")}
                            </Link>
                          ) : null}
                          {copyableLink ? (
                          <CopyTextButton
                            value={copyableLink}
                            idleLabel={t(locale, "actions.copy_link")}
                            copiedLabel={t(locale, "actions.link_copied")}
                            className={cn(
                              "h-8 w-8 shrink-0",
                              align === "right"
                                ? "border-white/20 bg-white/10 text-white hover:border-white/35 hover:text-white"
                                : "border-cyan-100/90 bg-white/88 text-cyan-700 hover:border-cyan-200 hover:text-cyan-800"
                            )}
                          />
                          ) : null}
                        </div>
                      ) : null}
                      <div
                        className={cn(
                          "text-[15px] leading-6 sm:leading-7",
                          align === "right" ? "text-white" : "text-slate-800"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {renderMessageText(entry.message, align)}
                        </p>
                      </div>
                    </section>
                  ) : null}

                  {entry.canonicalUrl ? (
                    <section>
                      <Link
                        href={entry.canonicalUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={cn(
                          "block overflow-hidden rounded-[20px] border transition hover:-translate-y-[1px] sm:rounded-[24px]",
                          align === "right"
                            ? "border-white/14 bg-white/8"
                            : "border-cyan-100/80 bg-cyan-50/58 hover:border-cyan-200"
                        )}
                      >
                        {entry.linkImageUrl ? (
                          <img
                            src={entry.linkImageUrl}
                            alt={entry.linkTitle || entry.linkSiteName || entry.canonicalUrl}
                            className="h-40 w-full object-cover sm:h-48"
                          />
                        ) : null}

                        <div className="space-y-2 px-4 py-3.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            {entry.linkSiteName ? (
                              <span className={cn(align === "right" ? "text-white/70" : "text-slate-500")}>
                                {entry.linkSiteName}
                              </span>
                            ) : null}
                            {entry.linkPublishedAt ? (
                              <>
                                {entry.linkSiteName ? <span>·</span> : null}
                                <span className={cn(align === "right" ? "text-white/70" : "text-slate-500")}>
                                  {formatDateTime(entry.linkPublishedAt, locale)}
                                </span>
                              </>
                            ) : null}
                            {linkFetchState ? (
                              <>
                                {entry.linkSiteName || entry.linkPublishedAt ? <span>·</span> : null}
                                <EntryStateBadge label={linkFetchState.label} tone={linkFetchState.tone} />
                              </>
                            ) : null}
                          </div>

                          <div>
                            <p
                              className={cn(
                                "text-base font-semibold leading-7",
                                align === "right" ? "text-white" : "text-slate-900"
                              )}
                            >
                              {entry.linkTitle || deriveLinkTitle(entry.canonicalUrl)}
                            </p>
                            {entry.linkDescription ? (
                              <p
                                className={cn(
                                  "mt-1 text-sm leading-6",
                                  align === "right" ? "text-white/82" : "text-slate-600"
                                )}
                              >
                                {entry.linkDescription}
                              </p>
                            ) : null}
                            {!entry.linkDescription && linkFetchState?.detail ? (
                              <p
                                className={cn(
                                  "mt-1 text-sm leading-6",
                                  align === "right" ? "text-white/72" : "text-slate-500"
                                )}
                              >
                                {linkFetchState.detail}
                              </p>
                            ) : null}
                            {entry.linkDescription && linkFetchState?.detail ? (
                              <p
                                className={cn(
                                  "mt-2 text-xs leading-5",
                                  align === "right" ? "text-white/68" : "text-slate-500"
                                )}
                              >
                                {linkFetchState.detail}
                              </p>
                            ) : null}
                          </div>

                          <p
                            className={cn(
                              "truncate text-xs",
                              align === "right" ? "text-white/65" : "text-cyan-700"
                            )}
                          >
                            {entry.canonicalUrl}
                          </p>
                        </div>
                      </Link>
                    </section>
                  ) : null}

                  {entry.note ? (
                    <section>
                      <div
                        className={cn(
                          "rounded-[18px] border px-3.5 py-3 sm:px-4",
                          align === "right"
                            ? "border-white/15 bg-white/8 text-white/92"
                            : "border-amber-100/80 bg-amber-50/72 text-slate-700"
                        )}
                      >
                        <p
                          className={cn(
                            "text-[11px] font-semibold uppercase tracking-[0.08em]",
                            align === "right" ? "text-white/70" : "text-amber-700"
                          )}
                        >
                          {t(locale, "entry.note")}
                        </p>
                        <p
                          className={cn(
                            "mt-2 whitespace-pre-wrap break-words text-sm leading-6",
                            align === "right" ? "text-white" : "text-slate-700"
                          )}
                        >
                          {entry.note}
                        </p>
                      </div>
                    </section>
                  ) : null}

                  <EntryExcerptList align={align} compact excerpts={entry.excerpts} locale={locale} />

                  {imageAssets.length > 0 ? (
                    <section className={cn("grid gap-2.5", imageAssets.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                      {imageAssets.map((asset) => (
                        <figure
                          key={asset.id}
                          className={cn(
                            "group relative overflow-hidden rounded-[20px] border shadow-[0_14px_28px_rgba(15,23,42,0.12)] sm:rounded-[24px]",
                            align === "right"
                              ? "border-white/16 bg-white/10"
                              : "border-white/70 bg-white/84"
                          )}
                        >
                          <Link href={assetPath(asset.id)} target="_blank" className="block">
                            <img
                              src={assetPath(asset.id)}
                              alt={asset.originalName}
                              className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-60"
                            />
                          </Link>

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.74))]" />
                          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 py-3">
                            <figcaption className="min-w-0 text-white">
                              <p className="truncate text-sm font-medium">{asset.originalName}</p>
                              <p className="mt-1 text-xs text-white/72">{formatBytes(asset.size)}</p>
                            </figcaption>
                            <div className="flex shrink-0 items-center gap-2">
                              <CopyImageButton
                                src={assetPath(asset.id)}
                                mimeType={asset.mimeType}
                                className="border-white/20 bg-white/14 text-white backdrop-blur-md hover:border-white/40 hover:text-white"
                              />
                              <DownloadIconLink
                                href={assetPath(asset.id)}
                                filename={asset.originalName}
                                label={t(locale, "entry.download")}
                                className="border-white/20 bg-white/14 text-white backdrop-blur-md hover:border-white/40 hover:text-white"
                              />
                            </div>
                          </div>
                        </figure>
                      ))}
                    </section>
                  ) : null}

                  {filePreviews.length > 0 ? (
                    <section className="space-y-2.5">
                      {filePreviews.map(({ asset, preview, visual }) => (
                        <div
                          key={asset.id}
                          className="message-card-inset overflow-hidden rounded-[20px] sm:rounded-[24px]"
                        >
                          {asset.kind === "VIDEO" ? (
                            <>
                              <video
                                controls
                                playsInline
                                preload="metadata"
                                className="max-h-[420px] w-full bg-slate-950"
                                src={assetPath(asset.id)}
                              />
                              <AssetFooter
                                assetName={asset.originalName}
                                meta={`${asset.mimeType} · ${formatBytes(asset.size)}`}
                                action={
                                  <DownloadIconLink
                                    href={assetPath(asset.id)}
                                    filename={asset.originalName}
                                    label={t(locale, "entry.download")}
                                  />
                                }
                              />
                            </>
                          ) : null}

                          {asset.kind === "PDF" ? (
                            preferPdfInlinePreview ? (
                              <>
                                <iframe
                                  src={`${assetPath(asset.id)}#toolbar=0&navpanes=0`}
                                  title={asset.originalName}
                                  className="h-[320px] w-full bg-slate-100 sm:h-[440px]"
                                />
                                <AssetFooter
                                  assetName={asset.originalName}
                                  meta={`${asset.mimeType} · ${formatBytes(asset.size)}`}
                                  action={
                                    <DownloadIconLink
                                      href={assetPath(asset.id)}
                                      filename={asset.originalName}
                                      label={t(locale, "entry.download")}
                                    />
                                  }
                                />
                              </>
                            ) : (
                              <div className="px-4 py-4">
                                <div className="flex items-start gap-3">
                                  <Link
                                    href={assetPath(asset.id)}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="flex min-w-0 flex-1 items-start gap-3 rounded-[18px] border border-transparent transition hover:border-cyan-100 hover:bg-cyan-50/30"
                                  >
                                    <FileVisualBadge visual={visual} />
                                    <div className="min-w-0 pt-0.5">
                                      <p className="truncate text-sm font-medium text-slate-900">
                                        {asset.originalName}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {asset.mimeType} · {formatBytes(asset.size)}
                                      </p>
                                    </div>
                                  </Link>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <OpenIconLink
                                      href={assetPath(asset.id)}
                                      label={t(locale, "entry.open")}
                                    />
                                    <DownloadIconLink
                                      href={assetPath(asset.id)}
                                      filename={asset.originalName}
                                      label={t(locale, "entry.download")}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          ) : null}

                          {asset.kind === "FILE" ? (
                            <div className="px-4 py-4">
                              <div className="flex items-start gap-3">
                                <Link
                                  href={assetPath(asset.id)}
                                  target="_blank"
                                  className="flex min-w-0 flex-1 items-start gap-3 rounded-[18px] border border-transparent transition hover:border-cyan-100 hover:bg-cyan-50/30"
                                >
                                  <FileVisualBadge visual={visual} />
                                  <div className="min-w-0 pt-0.5">
                                    <p className="truncate text-sm font-medium text-slate-900">
                                      {asset.originalName}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {asset.mimeType} · {formatBytes(asset.size)}
                                    </p>
                                  </div>
                                </Link>
                                <DownloadIconLink
                                  href={assetPath(asset.id)}
                                  filename={asset.originalName}
                                  label={t(locale, "entry.download")}
                                />
                              </div>

                              {preview ? (
                                <div className="mt-3 overflow-hidden rounded-[18px] border border-slate-200/70 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                                  {preview.kind === "markdown" ? (
                                    <div
                                      className="space-y-2 px-4 py-3 text-sm leading-7 text-slate-700 [&_a]:text-cyan-700 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc [&_pre]:overflow-x-auto [&_pre]:rounded-[14px] [&_pre]:bg-slate-950 [&_pre]:p-3 [&_pre]:text-slate-100"
                                      dangerouslySetInnerHTML={{ __html: preview.html }}
                                    />
                                  ) : null}

                                  {preview.kind === "text" ? (
                                    <pre className="scrollbar-thin overflow-x-auto px-4 py-3 text-sm leading-6 text-slate-700">
                                      {preview.text}
                                    </pre>
                                  ) : null}

                                  {preview.kind === "table" ? (
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full border-collapse text-sm text-slate-700">
                                        <thead>
                                          <tr className="border-b border-slate-200/80 bg-slate-50/80">
                                            {preview.columns.map((column) => (
                                              <th
                                                key={column}
                                                className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
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
                                                  key={`${column}-${columnIndex}`}
                                                  className="px-4 py-2 align-top text-sm text-slate-700"
                                                >
                                                  {row[columnIndex] || "-"}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : null}

                                  {preview.truncated ? (
                                    <div className="border-t border-slate-100/80 px-4 py-2 text-xs text-slate-400">
                                      {preview.kind === "table" && preview.sheetName
                                        ? `${asset.originalName} · ${preview.sheetName}`
                                        : asset.originalName}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </section>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function renderMessageText(message: string, align: "left" | "right"): ReactNode {
  const matches = [...message.matchAll(/(?:https?:\/\/|www\.)[^\s<]+/gi)];

  if (matches.length === 0) {
    return message;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const [index, match] of matches.entries()) {
    const start = match.index ?? 0;
    const rawUrl = match[0];

    if (start > cursor) {
      nodes.push(message.slice(cursor, start));
    }

    const { cleanUrl, trailingText } = splitTrailingUrlText(rawUrl);
    const href = normalizeExternalUrl(cleanUrl);

    if (href) {
      nodes.push(
        <a
          key={`message-link-${index}-${start}`}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(
            "break-all underline decoration-1 underline-offset-4 transition",
            align === "right"
              ? "text-white/95 decoration-white/45 hover:text-white hover:decoration-white"
              : "text-cyan-700 decoration-cyan-300 hover:text-cyan-800 hover:decoration-cyan-500"
          )}
        >
          {cleanUrl}
        </a>
      );
    } else {
      nodes.push(cleanUrl);
    }

    if (trailingText) {
      nodes.push(trailingText);
    }

    cursor = start + rawUrl.length;
  }

  if (cursor < message.length) {
    nodes.push(message.slice(cursor));
  }

  return nodes;
}

function splitTrailingUrlText(value: string) {
  let cleanUrl = value;
  let trailingText = "";

  while (cleanUrl.length > 0) {
    const lastCharacter = cleanUrl.at(-1);

    if (!lastCharacter) {
      break;
    }

    if (".,!?;:".includes(lastCharacter)) {
      trailingText = `${lastCharacter}${trailingText}`;
      cleanUrl = cleanUrl.slice(0, -1);
      continue;
    }

    if (lastCharacter === ")" && countChar(cleanUrl, ")") > countChar(cleanUrl, "(")) {
      trailingText = `${lastCharacter}${trailingText}`;
      cleanUrl = cleanUrl.slice(0, -1);
      continue;
    }

    if (lastCharacter === "]" && countChar(cleanUrl, "]") > countChar(cleanUrl, "[")) {
      trailingText = `${lastCharacter}${trailingText}`;
      cleanUrl = cleanUrl.slice(0, -1);
      continue;
    }

    if (lastCharacter === "}" && countChar(cleanUrl, "}") > countChar(cleanUrl, "{")) {
      trailingText = `${lastCharacter}${trailingText}`;
      cleanUrl = cleanUrl.slice(0, -1);
      continue;
    }

    break;
  }

  return {
    cleanUrl,
    trailingText
  };
}

function deriveLinkTitle(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function countChar(value: string, character: string) {
  return [...value].filter((item) => item === character).length;
}

type AssetFooterProps = {
  action: ReactNode;
  assetName: string;
  meta: string;
};

type FileVisualBadgeProps = {
  visual: ReturnType<typeof getFileVisual>;
};

function EntryStateBadge({
  label,
  tone
}: {
  label: string;
  tone: "amber" | "cyan" | "emerald" | "rose" | "slate";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em]",
        tone === "amber"
          ? "border-amber-200/80 bg-amber-50/90 text-amber-700"
          : tone === "cyan"
            ? "border-cyan-200/80 bg-cyan-50/90 text-cyan-700"
          : tone === "emerald"
            ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-700"
          : tone === "rose"
            ? "border-rose-200/80 bg-rose-50/90 text-rose-700"
          : "border-slate-200/80 bg-white/85 text-slate-500"
      )}
    >
      {label}
    </span>
  );
}

function getSearchSourceLabel(locale: AppLocale, source: EntrySearchSnippetSource) {
  switch (source) {
    case "assetName":
      return t(locale, "search.source_asset_name");
    case "assetText":
      return t(locale, "search.source_asset_text");
    case "link":
      return t(locale, "search.source_link");
    case "note":
      return t(locale, "search.source_note");
    case "excerpt":
      return t(locale, "search.source_excerpt");
    case "sender":
      return t(locale, "search.source_sender");
    default:
      return t(locale, "search.source_message");
  }
}

function getReadingStateLabel(locale: AppLocale, readingState: ReadingState) {
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

function getReadingStateTone(readingState: ReadingState): "amber" | "cyan" | "emerald" | "slate" {
  switch (readingState) {
    case "LATER":
      return "amber";
    case "READING":
      return "cyan";
    case "DONE":
      return "emerald";
    default:
      return "slate";
  }
}

function getLinkFetchState(
  locale: AppLocale,
  status: string | null | undefined,
  error: string | null | undefined
): null | {
  detail: string | null;
  label: string;
  tone: "amber" | "cyan" | "emerald" | "rose" | "slate";
} {
  switch (status) {
    case "PENDING":
      return {
        detail: t(locale, "link.status_pending_hint"),
        label: t(locale, "link.status_pending"),
        tone: "amber"
      };
    case "PROCESSING":
      return {
        detail: t(locale, "link.status_processing_hint"),
        label: t(locale, "link.status_processing"),
        tone: "cyan"
      };
    case "SUCCESS":
      return {
        detail: null,
        label: t(locale, "link.status_success"),
        tone: "emerald"
      };
    case "BLOCKED":
      return {
        detail: getLinkFetchErrorMessage(locale, error),
        label: t(locale, "link.status_blocked"),
        tone: "slate"
      };
    case "FAILED":
      return {
        detail: getLinkFetchErrorMessage(locale, error),
        label: t(locale, "link.status_failed"),
        tone: "rose"
      };
    default:
      return null;
  }
}

function getLinkFetchErrorMessage(locale: AppLocale, error: string | null | undefined) {
  if (!error) {
    return t(locale, "link.error_generic");
  }

  if (error.startsWith("LINK_FETCH_BLOCKED_HOST")) {
    return t(locale, "link.error_blocked_host");
  }

  if (error.startsWith("LINK_FETCH_BLOCKED_PRIVATE_IP")) {
    return t(locale, "link.error_blocked_private");
  }

  if (error.startsWith("LINK_FETCH_UNSUPPORTED_CONTENT_TYPE")) {
    return t(locale, "link.error_unsupported");
  }

  if (error.startsWith("LINK_FETCH_FAILED_")) {
    const statusCode = error.replace("LINK_FETCH_FAILED_", "");
    return t(locale, "link.error_http", { status: statusCode });
  }

  if (error.includes("aborted") || error.includes("AbortError")) {
    return t(locale, "link.error_timeout");
  }

  return t(locale, "link.error_generic");
}

function renderHighlightedText(
  text: string,
  query: string,
  align: "left" | "right"
): ReactNode {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return text;
  }

  const lowerText = text.toLocaleLowerCase();
  const lowerQuery = normalizedQuery.toLocaleLowerCase();
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = lowerText.indexOf(lowerQuery);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      nodes.push(text.slice(cursor, matchIndex));
    }

    nodes.push(
      <mark
        key={`highlight-${matchIndex}`}
        className={cn(
          "rounded px-1 py-0.5",
          align === "right" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"
        )}
      >
        {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </mark>
    );

    cursor = matchIndex + normalizedQuery.length;
    matchIndex = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function FileVisualBadge({ visual }: FileVisualBadgeProps) {
  const toneClassName =
    visual.tone === "blue"
      ? "from-sky-500 to-blue-600 shadow-sky-200/70"
      : visual.tone === "green"
        ? "from-emerald-500 to-green-600 shadow-emerald-200/70"
        : visual.tone === "amber"
          ? "from-amber-400 to-orange-500 shadow-amber-200/70"
          : visual.tone === "rose"
            ? "from-rose-400 to-pink-500 shadow-rose-200/70"
            : visual.tone === "violet"
              ? "from-violet-500 to-fuchsia-500 shadow-violet-200/70"
              : visual.tone === "cyan"
                ? "from-cyan-500 to-teal-500 shadow-cyan-200/70"
                : "from-slate-600 to-slate-800 shadow-slate-200/70";

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br text-[11px] font-bold text-white shadow-[0_12px_26px_rgba(15,23,42,0.14)]",
          toneClassName
        )}
      >
        {visual.badge}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {visual.label}
      </span>
    </div>
  );
}

function AssetFooter({ action, assetName, meta }: AssetFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-black/5 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{assetName}</p>
        <p className="mt-1 text-xs text-slate-500">{meta}</p>
      </div>
      {action}
    </div>
  );
}

type DownloadIconLinkProps = {
  className?: string;
  filename: string;
  href: string;
  label: string;
};

function DownloadIconLink({ href, filename, label, className }: DownloadIconLinkProps) {
  return (
    <a
      href={href}
      download={filename}
      aria-label={label}
      title={label}
      className={cn("entry-icon-button shrink-0", className)}
    >
      <DownloadIcon />
    </a>
  );
}

type OpenIconLinkProps = {
  className?: string;
  href: string;
  label: string;
};

function OpenIconLink({ href, label, className }: OpenIconLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className={cn("entry-icon-button shrink-0", className)}
    >
      <OpenIcon />
    </a>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5v7.2m0 0 3-3m-3 3-3-3M4.5 13.7v1.1a1.7 1.7 0 0 0 1.7 1.7h7.6a1.7 1.7 0 0 0 1.7-1.7v-1.1" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 4h4.5v4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11 16 4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 11.5v2.3a1.7 1.7 0 0 1-1.7 1.7H6.2a1.7 1.7 0 0 1-1.7-1.7V6.2a1.7 1.7 0 0 1 1.7-1.7h2.3"
      />
    </svg>
  );
}
