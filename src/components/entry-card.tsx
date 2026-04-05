import Link from "next/link";

import { EntryActions } from "@/components/entry-actions";
import { entryTypeLabels } from "@/lib/file-types";
import type { EntryWithRelations } from "@/lib/entries";
import { cn, formatBytes, formatDateTime, isIpv4Address } from "@/lib/utils";

type EntryCardProps = {
  entry: EntryWithRelations;
  publicView?: boolean;
  shareBaseUrl: string;
};

export function EntryCard({ entry, publicView = false, shareBaseUrl }: EntryCardProps) {
  const shareUrl =
    entry.shareLink && !entry.shareLink.revokedAt
      ? `${shareBaseUrl}/share/${entry.shareLink.token}`
      : undefined;
  const imageAssets = entry.assets.filter((asset) => asset.kind === "IMAGE");
  const nonImageAssets = entry.assets.filter((asset) => asset.kind !== "IMAGE");
  const visibleIp = isIpv4Address(entry.senderIp) ? entry.senderIp : null;
  const isCurrentDevice =
    !publicView && (!visibleIp || visibleIp === "127.0.0.1" || entry.senderName === "当前设备");
  const align = isCurrentDevice ? "right" : "left";
  const sourceLabel =
    entry.senderHost && visibleIp
      ? `${entry.senderHost} · ${visibleIp}`
      : entry.senderHost || visibleIp || "本机来源";

  return (
    <article className={cn("flex w-full", align === "right" ? "justify-end" : "justify-start")}>
      <div className="w-full max-w-[54rem]">
        <div
          className={cn(
            "flex items-end gap-3 sm:gap-4",
            align === "right" ? "flex-row-reverse" : "flex-row"
          )}
        >
          <div
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)] sm:h-11 sm:w-11",
              align === "right"
                ? "bg-[linear-gradient(135deg,#14b8a6,#38bdf8)]"
                : "bg-[linear-gradient(135deg,#0f172a,#334155_60%,#6366f1)]"
            )}
          >
            {entry.senderName.slice(0, 1).toUpperCase()}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "mb-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 sm:text-xs",
                align === "right" ? "justify-end text-right" : "justify-start text-left"
              )}
            >
              <span className="font-semibold text-slate-700">{entry.senderName}</span>
              <span className="rounded-full border border-white/72 bg-white/72 px-2.5 py-1 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                {sourceLabel}
              </span>
              <span>{formatDateTime(entry.createdAt)}</span>
              <span className="rounded-full border border-white/72 bg-white/72 px-2.5 py-1 font-medium text-slate-600">
                {entryTypeLabels[entry.type]}
              </span>
              {entry.shareLink?.revokedAt ? (
                <span className="rounded-full border border-rose-100/90 bg-rose-50/80 px-2.5 py-1 font-medium text-rose-600">
                  分享已撤销
                </span>
              ) : null}
            </div>

            <div
              className={cn(
                "message-shell bubble-shadow transition hover:-translate-y-[1px]",
                align === "right" ? "message-shell-right" : "message-shell-left"
              )}
            >
              <div className={align === "right" ? "message-tint-right" : "message-tint-left"} />

              <div className="space-y-4 px-4 py-4 sm:px-5">
                {entry.message ? (
                  <div className="text-[15px] leading-7 text-slate-800">
                    <p className="whitespace-pre-wrap break-words">{entry.message}</p>
                  </div>
                ) : null}

                {imageAssets.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {imageAssets.map((asset) => (
                      <Link
                        key={asset.id}
                        href={`/api/assets/${asset.id}`}
                        target="_blank"
                        className="overflow-hidden rounded-[28px] border border-white/72 bg-white/82 shadow-[0_16px_32px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px]"
                      >
                        <img
                          src={`/api/assets/${asset.id}`}
                          alt={asset.originalName}
                          className="h-60 w-full object-cover transition duration-300 hover:scale-[1.02]"
                        />
                        <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-slate-500">
                          <span className="truncate">{asset.originalName}</span>
                          <span>{formatBytes(asset.size)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {nonImageAssets.length > 0 ? (
                  <div className="space-y-3">
                    {nonImageAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="overflow-hidden rounded-[28px] border border-white/72 bg-white/82 shadow-[0_16px_32px_rgba(15,23,42,0.07)]"
                      >
                        {asset.kind === "VIDEO" ? (
                          <video
                            controls
                            playsInline
                            preload="metadata"
                            className="max-h-[460px] w-full bg-slate-950"
                            src={`/api/assets/${asset.id}`}
                          />
                        ) : null}

                        {asset.kind === "PDF" ? (
                          <iframe
                            src={`/api/assets/${asset.id}#toolbar=0&navpanes=0`}
                            title={asset.originalName}
                            className="h-[460px] w-full bg-slate-100"
                          />
                        ) : null}

                        {asset.kind === "FILE" ? (
                          <div className="flex items-center justify-between gap-4 px-4 py-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {asset.originalName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {asset.mimeType} · {formatBytes(asset.size)}
                              </p>
                            </div>
                            <Link
                              href={`/api/assets/${asset.id}`}
                              target="_blank"
                              className="rounded-full border border-slate-200/90 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                            >
                              打开
                            </Link>
                          </div>
                        ) : null}

                        {asset.kind !== "FILE" ? (
                          <div className="flex items-center justify-between gap-4 border-t border-black/5 px-4 py-3 text-xs text-slate-500">
                            <span className="truncate">{asset.originalName}</span>
                            <Link
                              href={`/api/assets/${asset.id}`}
                              target="_blank"
                              className="font-medium text-cyan-700"
                            >
                              新窗口打开
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {!publicView ? (
              <EntryActions align={align} entryId={entry.id} initialShareUrl={shareUrl} />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
