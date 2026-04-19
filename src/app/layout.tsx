import type { Metadata } from "next";
import Link from "next/link";

import "@/app/globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { t } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n-server";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "OmniDrop",
  description: "Personal digital drawer for files, notes and quick sharing.",
  icons: {
    apple: [{ sizes: "180x180", type: "image/png", url: "/apple-icon" }],
    icon: [{ sizes: "64x64", type: "image/png", url: "/icon" }],
    shortcut: ["/icon"]
  }
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = getServerI18n();
  const settings = await getSettings();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <I18nProvider locale={locale}>
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="ambient-grid absolute inset-0 opacity-[0.16]" />
            <div className="aurora-orb aurora-orb-a" />
            <div className="aurora-orb aurora-orb-b" />
            <div className="aurora-orb aurora-orb-c" />
            <div className="noise-layer absolute inset-0 opacity-[0.18]" />
          </div>

          <div className="min-h-screen">
            <header className="sticky top-0 z-30 px-2 pt-2 sm:px-5 sm:pt-4">
              <div className="nav-dock mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
                <Link
                  href="/"
                  aria-label={settings.appName}
                  title={settings.appName}
                  className="flex shrink-0 items-center"
                >
                  <div className="brand-mark">
                    <span className="relative z-[1] text-sm font-semibold text-white">O</span>
                  </div>
                </Link>

                <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <div
                    id="header-extras"
                    className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2"
                  />
                  <Link
                    href="/collections"
                    aria-label={t(locale, "header.collections")}
                    className="glass-button inline-flex h-9 items-center justify-center gap-2 rounded-full px-2.5 text-sm font-medium text-slate-700 transition hover:-translate-y-[1px] hover:text-slate-950 sm:h-10 sm:px-4"
                  >
                    <CollectionsIcon />
                    <span className="hidden sm:inline">{t(locale, "header.collections")}</span>
                  </Link>
                  <Link
                    href="/duplicates"
                    aria-label={messages["header.duplicates"]}
                    className="glass-button inline-flex h-9 items-center justify-center gap-2 rounded-full px-2.5 text-sm font-medium text-slate-700 transition hover:-translate-y-[1px] hover:text-slate-950 sm:h-10 sm:px-4"
                  >
                    <DuplicatesIcon />
                    <span className="hidden sm:inline">{messages["header.duplicates"]}</span>
                  </Link>
                  <Link
                    href="/settings"
                    aria-label={messages["header.settings"]}
                    className="glass-button inline-flex h-9 items-center justify-center gap-2 rounded-full px-2.5 text-sm font-medium text-slate-700 transition hover:-translate-y-[1px] hover:text-slate-950 sm:h-10 sm:px-4"
                  >
                    <SettingsIcon />
                    <span className="hidden sm:inline">{messages["header.settings"]}</span>
                  </Link>
                </nav>
              </div>
            </header>

            <main className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">{children}</main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.2 3.6a1 1 0 0 1 1.6 0l1.03 1.41a1 1 0 0 0 1.08.37l1.69-.54a1 1 0 0 1 1.38.8l.23 1.72a1 1 0 0 0 .72.85l1.67.45a1 1 0 0 1 .5 1.52l-.96 1.46a1 1 0 0 0 0 1.1l.96 1.46a1 1 0 0 1-.5 1.52l-1.67.45a1 1 0 0 0-.72.85l-.23 1.72a1 1 0 0 1-1.38.8l-1.69-.54a1 1 0 0 0-1.08.37L11.8 20.4a1 1 0 0 1-1.6 0l-1.03-1.41a1 1 0 0 0-1.08-.37l-1.69.54a1 1 0 0 1-1.38-.8l-.23-1.72a1 1 0 0 0-.72-.85l-1.67-.45a1 1 0 0 1-.5-1.52l.96-1.46a1 1 0 0 0 0-1.1l-.96-1.46a1 1 0 0 1 .5-1.52l1.67-.45a1 1 0 0 0 .72-.85l.23-1.72a1 1 0 0 1 1.38-.8l1.69.54a1 1 0 0 0 1.08-.37L10.2 3.6Z"
      />
      <circle cx="12" cy="12" r="3.15" />
    </svg>
  );
}

function DuplicatesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4.25" y="7.25" width="10.5" height="10.5" rx="2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.25 4.25h6.5a4 4 0 0 1 4 4v6.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 10.5h2.75v4.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 13.75h1.75" />
    </svg>
  );
}

function CollectionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4.5" y="5.25" width="15" height="4.5" rx="1.8" />
      <rect x="4.5" y="14.25" width="9.5" height="4.5" rx="1.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.9 15.3h2.6m-1.3-1.3v2.6" />
    </svg>
  );
}
