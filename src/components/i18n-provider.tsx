"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";

import {
  getMessages,
  getEntryTypeLabels,
  interpolate,
  localeCookieName,
  localeOptions,
  type AppLocale,
  type MessageKey
} from "@/lib/i18n";

type I18nContextValue = {
  entryTypeLabels: ReturnType<typeof getEntryTypeLabels>;
  locale: AppLocale;
  localeOptions: typeof localeOptions;
  setLocale: (locale: AppLocale) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: React.ReactNode;
  locale: AppLocale;
};

export function I18nProvider({ children, locale }: I18nProviderProps) {
  const router = useRouter();
  const messages = getMessages(locale);
  const entryTypeLabels = getEntryTypeLabels(locale);

  function setLocale(nextLocale: AppLocale) {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  function translate(key: MessageKey, params?: Record<string, string | number>) {
    return interpolate(messages[key], params);
  }

  return (
    <I18nContext.Provider
      value={{
        entryTypeLabels,
        locale,
        localeOptions,
        setLocale,
        t: translate
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("I18nProvider is missing.");
  }

  return value;
}
