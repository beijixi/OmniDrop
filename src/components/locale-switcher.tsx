"use client";

import { useId } from "react";

import { useI18n } from "@/components/i18n-provider";

type LocaleSwitcherProps = {
  variant?: "compact" | "field";
};

export function LocaleSwitcher({ variant = "compact" }: LocaleSwitcherProps) {
  const { locale, localeOptions, setLocale, t } = useI18n();
  const selectId = useId();
  const activeLocale = localeOptions.find((option) => option.code === locale);

  if (variant === "field") {
    return (
      <div className="space-y-2">
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {t("header.language")}
        </label>
        <div className="relative">
          <select
            id={selectId}
            value={locale}
            onChange={(event) => setLocale(event.target.value as typeof locale)}
            className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            aria-label={t("header.language")}
          >
            {localeOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <ChevronDownIcon />
          </span>
        </div>
      </div>
    );
  }

  return (
    <label
      htmlFor={selectId}
      className="glass-button relative inline-flex h-9 min-w-[3rem] items-center justify-center rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 sm:h-10 sm:min-w-[3.25rem] sm:text-xs"
      aria-label={t("header.language")}
    >
      <span>{activeLocale?.label || locale}</span>
      <select
        id={selectId}
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className="absolute inset-0 appearance-none rounded-full opacity-0"
        aria-label={t("header.language")}
      >
        {localeOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 7 5 5 5-5" />
    </svg>
  );
}
