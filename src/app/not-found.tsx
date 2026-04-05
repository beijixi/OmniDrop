import Link from "next/link";

import { getServerI18n } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default function NotFound() {
  const { locale } = getServerI18n();

  return (
    <div className="mx-auto max-w-2xl">
      <section className="panel px-6 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          {t(locale, "not_found.title")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {t(locale, "not_found.description")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          {t(locale, "not_found.back_home")}
        </Link>
      </section>
    </div>
  );
}
