import type { AppLocale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { getExcerptSourceLabelKey, type ExcerptSource, type ExcerptWithRelations } from "@/lib/excerpts";
import { cn, formatDateTime } from "@/lib/utils";

type EntryExcerptListProps = {
  align?: "left" | "right";
  compact?: boolean;
  excerpts: ExcerptWithRelations[];
  locale: AppLocale;
};

export function EntryExcerptList({
  align = "left",
  compact = false,
  excerpts,
  locale
}: EntryExcerptListProps) {
  if (excerpts.length === 0) {
    return null;
  }

  const visibleExcerpts = compact ? excerpts.slice(0, 2) : excerpts;

  return (
    <section>
      <div
        className={cn(
          "rounded-[18px] border px-3.5 py-3 sm:px-4",
          align === "right"
            ? "border-white/15 bg-white/8 text-white/92"
            : "border-emerald-100/80 bg-emerald-50/72 text-slate-700"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.08em]",
              align === "right" ? "text-white/70" : "text-emerald-700"
            )}
          >
            {t(locale, "excerpt.title")}
          </p>
          <span className={cn("text-[11px]", align === "right" ? "text-white/65" : "text-slate-500")}>
            {excerpts.length}
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {visibleExcerpts.map((excerpt) => (
            <article
              key={excerpt.id}
              className={cn(
                "rounded-[16px] px-3 py-2.5",
                align === "right" ? "bg-white/8" : "bg-white/88"
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span
                  className={cn(
                    "font-semibold",
                    align === "right" ? "text-white/72" : "text-slate-500"
                  )}
                >
                  {t(locale, getExcerptSourceLabelKey(excerpt.source as ExcerptSource))}
                </span>
                {excerpt.asset?.originalName ? (
                  <span className={cn(align === "right" ? "text-white/68" : "text-slate-400")}>
                    · {excerpt.asset.originalName}
                  </span>
                ) : null}
                <span className={cn(align === "right" ? "text-white/60" : "text-slate-400")}>
                  · {formatDateTime(excerpt.createdAt, locale)}
                </span>
              </div>

              <blockquote
                className={cn(
                  "mt-2 whitespace-pre-wrap break-words border-l-2 pl-3 text-sm leading-6",
                  align === "right"
                    ? "border-white/20 text-white"
                    : "border-emerald-200/90 text-slate-700"
                )}
              >
                {excerpt.content}
              </blockquote>

              {excerpt.note ? (
                <div className="mt-2">
                  <p
                    className={cn(
                      "text-[11px] font-medium",
                      align === "right" ? "text-white/66" : "text-slate-500"
                    )}
                  >
                    {t(locale, "excerpt.note_label")}
                  </p>
                  <p
                    className={cn(
                      "mt-1 whitespace-pre-wrap break-words text-sm leading-6",
                      align === "right" ? "text-white/92" : "text-slate-700"
                    )}
                  >
                    {excerpt.note}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
