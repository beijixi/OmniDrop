import { SettingsForm } from "@/components/settings-form";
import { getServerI18n } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  const { locale } = getServerI18n();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
          {t(locale, "settings.eyebrow")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {t(locale, "settings.title")}
        </h1>
      </section>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
