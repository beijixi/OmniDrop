import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <section className="panel px-6 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">内容不存在</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          这个分享链接可能已经失效，或者对应内容已被移除。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          回到首页
        </Link>
      </section>
    </div>
  );
}
