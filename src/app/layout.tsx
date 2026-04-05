import type { Metadata } from "next";
import Link from "next/link";

import "@/app/globals.css";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "OmniDrop",
  description: "Personal digital drawer for files, notes and quick sharing."
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="zh-CN">
      <body className="antialiased">
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
              <Link href="/" className="flex min-w-0 items-center gap-2.5">
                <div className="brand-mark">
                  <span className="relative z-[1] text-sm font-semibold text-white">O</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">
                    {settings.appName}
                  </p>
                </div>
              </Link>

              <nav className="flex items-center gap-2">
                <Link
                  href="/settings"
                  aria-label="打开设置"
                  className="glass-button inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-slate-700 transition hover:-translate-y-[1px] hover:text-slate-950 sm:px-4"
                >
                  <SettingsIcon />
                  <span className="hidden sm:inline">设置</span>
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">{children}</main>
        </div>
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
