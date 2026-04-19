import type { AppLocale } from "@/lib/i18n";
import type { DuplicateGroup, DuplicateGroupRecommendationReason, EntryWithRelations } from "@/lib/entries";
import { normalizeMessageText, formatBytes, formatDateTime, cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

import { DuplicateGroupActions, DuplicateGroupKeepButton } from "@/components/duplicate-group-actions";

type DuplicateGroupCardProps = {
  group: DuplicateGroup;
  locale: AppLocale;
};

export function DuplicateGroupCard({ group, locale }: DuplicateGroupCardProps) {
  const recommendedEntry =
    group.entries.find((entry) => entry.id === group.recommendedEntryId) || group.entries[0];
  const newestEntry = group.entries.find((entry) => entry.id === group.newestEntryId) || group.entries[0];
  const oldestEntry = group.entries.find((entry) => entry.id === group.oldestEntryId) || group.entries[0];

  return (
    <article className="panel relative overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(90deg,rgba(244,63,94,0),rgba(244,63,94,0.12),rgba(251,191,36,0.08),rgba(244,63,94,0))]" />

      <div className="relative space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-rose-200/80 bg-rose-50/80 px-3 py-1 text-xs font-semibold text-rose-700">
                {getDuplicateKindLabel(locale, group.kind)}
              </span>
              <span className="rounded-full border border-white/80 bg-white/84 px-3 py-1 text-xs font-medium text-slate-600">
                {t(locale, "duplicates.group_count", { count: group.count })}
              </span>
              <span className="text-xs text-slate-400">
                {t(locale, "duplicates.latest")} {formatDateTime(newestEntry.createdAt, locale)}
              </span>
              <span className="text-xs text-slate-400">
                {t(locale, "duplicates.oldest")} {formatDateTime(oldestEntry.createdAt, locale)}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {buildDuplicateGroupTitle(group, locale)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{buildDuplicateGroupDescription(group, locale)}</p>
            </div>
          </div>

          <DuplicateGroupActions count={group.count} groupKey={group.key} groupKind={group.kind} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-cyan-100/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0.92))] p-4 shadow-[0_18px_32px_rgba(14,165,233,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
                  {t(locale, "duplicates.recommended")}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {t(locale, "duplicates.reasons_label")}: {group.recommendedReasons.map((reason) => getRecommendationLabel(locale, reason)).join(" · ")}
                </p>
              </div>
              <span className="rounded-full border border-cyan-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-cyan-700">
                {t(locale, "duplicates.recommended_mark")}
              </span>
            </div>

            <div className="mt-4">
              <DuplicateGroupMemberRow
                count={group.count}
                entry={recommendedEntry}
                highlighted
                locale={locale}
                groupKey={group.key}
                groupKind={group.kind}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                {t(locale, "duplicates.members")}
              </p>
              <span className="text-xs text-slate-400">{t(locale, "duplicates.group_count", { count: group.count })}</span>
            </div>

            <div className="space-y-3">
              {group.entries.map((entry) => (
                <DuplicateGroupMemberRow
                  key={entry.id}
                  count={group.count}
                  entry={entry}
                  highlighted={entry.id === group.recommendedEntryId}
                  locale={locale}
                  groupKey={group.key}
                  groupKind={group.kind}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}

type DuplicateGroupMemberRowProps = {
  count: number;
  entry: EntryWithRelations;
  groupKey: string;
  groupKind: DuplicateGroup["kind"];
  highlighted?: boolean;
  locale: AppLocale;
};

function DuplicateGroupMemberRow({
  count,
  entry,
  groupKey,
  groupKind,
  highlighted = false,
  locale
}: DuplicateGroupMemberRowProps) {
  const previewText = buildEntryPreview(entry, locale);
  const assetSummary = buildAssetSummary(entry, locale);
  const shareActive = Boolean(entry.shareLink && !entry.shareLink.revokedAt);
  const displaySenderName =
    entry.senderName === "current-device" || entry.senderName === "当前设备"
      ? t(locale, "entry.local_source")
      : entry.senderName;

  return (
    <div
      className={cn(
        "rounded-[24px] border px-4 py-4 shadow-[0_12px_26px_rgba(15,23,42,0.05)]",
        highlighted
          ? "border-cyan-200/90 bg-white/96"
          : "border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.92))]"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{displaySenderName}</span>
            <span>{formatDateTime(entry.createdAt, locale)}</span>
            {entry.pinnedAt ? <EntryStateToken label={t(locale, "entry.pinned")} tone="cyan" /> : null}
            {entry.isFavorite ? <EntryStateToken label={t(locale, "entry.favorite")} tone="amber" /> : null}
            {entry.archivedAt ? <EntryStateToken label={t(locale, "entry.archived")} tone="slate" /> : null}
            {shareActive ? <EntryStateToken label={t(locale, "duplicates.reason_shared")} tone="emerald" /> : null}
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{previewText}</p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {assetSummary ? <span>{assetSummary}</span> : null}
            {entry.senderHost ? <span>{entry.senderHost}</span> : null}
            {entry.senderIp ? <span>{entry.senderIp}</span> : null}
          </div>
        </div>

        <DuplicateGroupKeepButton
          count={count}
          entryId={entry.id}
          groupKey={groupKey}
          groupKind={groupKind}
        />
      </div>
    </div>
  );
}

function buildDuplicateGroupTitle(group: DuplicateGroup, locale: AppLocale) {
  if (group.kind === "url") {
    try {
      return new URL(group.key).hostname;
    } catch {
      return group.key;
    }
  }

  if (group.kind === "asset") {
    const asset = group.entries[0]?.assets[0];
    return asset?.originalName || getDuplicateKindLabel(locale, group.kind);
  }

  return truncateText(normalizeMessageText(group.entries[0]?.message || "") || group.key, 72);
}

function buildDuplicateGroupDescription(group: DuplicateGroup, locale: AppLocale) {
  if (group.kind === "url") {
    return group.key;
  }

  if (group.kind === "asset") {
    const asset = group.entries[0]?.assets[0];
    return asset ? `${asset.originalName} · ${formatBytes(asset.size)}` : t(locale, "duplicates.kind_asset");
  }

  return truncateText(normalizeMessageText(group.entries[0]?.message || "") || group.key, 120);
}

function buildEntryPreview(entry: EntryWithRelations, locale: AppLocale) {
  const normalizedMessage = normalizeMessageText(entry.message || "");

  if (normalizedMessage) {
    return truncateText(normalizedMessage, 180);
  }

  if (entry.assets.length === 1) {
    const asset = entry.assets[0];
    return `${asset.originalName} · ${formatBytes(asset.size)}`;
  }

  if (entry.assets.length > 1) {
    return t(locale, "duplicates.member_assets", { count: entry.assets.length });
  }

  return getDuplicateKindLabel(locale, "text");
}

function buildAssetSummary(entry: EntryWithRelations, locale: AppLocale) {
  if (entry.assets.length === 0) {
    return "";
  }

  if (entry.assets.length === 1) {
    const asset = entry.assets[0];
    return `${asset.originalName} · ${formatBytes(asset.size)}`;
  }

  return t(locale, "duplicates.member_assets", { count: entry.assets.length });
}

function getDuplicateKindLabel(locale: AppLocale, kind: DuplicateGroup["kind"]) {
  if (kind === "asset") {
    return t(locale, "duplicates.kind_asset");
  }

  if (kind === "url") {
    return t(locale, "duplicates.kind_url");
  }

  return t(locale, "duplicates.kind_text");
}

function getRecommendationLabel(locale: AppLocale, reason: DuplicateGroupRecommendationReason) {
  if (reason === "pinned") {
    return t(locale, "duplicates.reason_pinned");
  }

  if (reason === "favorite") {
    return t(locale, "duplicates.reason_favorite");
  }

  if (reason === "shared") {
    return t(locale, "duplicates.reason_shared");
  }

  if (reason === "active") {
    return t(locale, "duplicates.reason_active");
  }

  return t(locale, "duplicates.reason_newest");
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function EntryStateToken(input: {
  label: string;
  tone: "amber" | "cyan" | "emerald" | "slate";
}) {
  const className =
    input.tone === "cyan"
      ? "border-cyan-200/80 bg-cyan-50/80 text-cyan-700"
      : input.tone === "amber"
        ? "border-amber-200/80 bg-amber-50/80 text-amber-700"
      : input.tone === "emerald"
        ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-700"
      : "border-slate-200/80 bg-slate-50/80 text-slate-600";

  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", className)}>
      {input.label}
    </span>
  );
}
