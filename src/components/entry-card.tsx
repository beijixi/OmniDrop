import Link from "next/link";
import type { ReactNode } from "react";

import { CopyImageButton } from "@/components/clipboard-buttons";
import { EntryActions } from "@/components/entry-actions";
import { getAssetPreview } from "@/lib/asset-previews";
import type { AppLocale } from "@/lib/i18n";
import { getFileVisual } from "@/lib/file-types";
import type { EntryWithRelations } from "@/lib/entries";
import { t } from "@/lib/i18n";
import { cn, formatBytes, formatDateTime, isIpv4Address } from "@/lib/utils";

type EntryCardProps = {
  entry: EntryWithRelations;
  locale: AppLocale;
  publicView?: boolean;
  viewerIp?: string | null;
};

export async function EntryCard({
  entry,
  locale,
  publicView = false,
  viewerIp = null
}: EntryCardProps) {
  const displaySenderName =
    entry.senderName === "current-device" || entry.senderName === "当前设备"
      ? t(locale, "entry.local_source")
      : entry.senderName;
  const assetPath = (assetId: string) => `/api/v1/assets/${assetId}`;
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
                  entryId={entry.id}
                  hasActiveShare={Boolean(entry.shareLink && !entry.shareLink.revokedAt)}
                  messageText={entry.message}
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
                  <span>{formatDateTime(entry.createdAt, locale)}</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-slate-400 sm:text-xs">
                  {sourceLabel}
                  {entry.shareLink?.revokedAt ? (
                    <span className="text-rose-500"> · {t(locale, "entry.share_revoked")}</span>
                  ) : null}
                </div>
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
                  {entry.message ? (
                    <section>
                      <div
                        className={cn(
                          "text-[15px] leading-6 sm:leading-7",
                          align === "right" ? "text-white" : "text-slate-800"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{entry.message}</p>
                      </div>
                    </section>
                  ) : null}

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

type AssetFooterProps = {
  action: ReactNode;
  assetName: string;
  meta: string;
};

type FileVisualBadgeProps = {
  visual: ReturnType<typeof getFileVisual>;
};

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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5v7.2m0 0 3-3m-3 3-3-3M4.5 13.7v1.1a1.7 1.7 0 0 0 1.7 1.7h7.6a1.7 1.7 0 0 0 1.7-1.7v-1.1" />
    </svg>
  );
}
