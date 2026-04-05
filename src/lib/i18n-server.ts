import { cookies, headers } from "next/headers";

import { env } from "@/lib/env";
import {
  getMessages,
  localeCookieName,
  matchLocaleFromAcceptLanguage,
  resolveLocale,
  type AppLocale
} from "@/lib/i18n";

export function getRequestLocale(): AppLocale {
  const cookieValue = cookies().get(localeCookieName)?.value;

  if (cookieValue) {
    return resolveLocale(cookieValue);
  }

  const headerValue = headers().get("accept-language");
  const matched = matchLocaleFromAcceptLanguage(headerValue);

  return matched || env.defaultLocale;
}

export function getServerI18n() {
  const locale = getRequestLocale();
  const messages = getMessages(locale);

  return {
    locale,
    messages
  };
}
