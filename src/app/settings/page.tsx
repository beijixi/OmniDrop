import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">基础设置</h1>
        <p className="text-sm leading-7 text-slate-600">
          MVP 只保留最必要的个性化配置，避免把个人工具做成复杂后台。
        </p>
      </section>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
