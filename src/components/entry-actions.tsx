"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type EntryActionsProps = {
  align?: "left" | "right";
  entryId: string;
  initialShareUrl?: string;
};

export function EntryActions({
  align = "left",
  entryId,
  initialShareUrl
}: EntryActionsProps) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState(initialShareUrl || "");
  const [status, setStatus] = useState("");
  const [loadingAction, setLoadingAction] = useState<"share" | "revoke" | "delete" | "">("");

  async function handleShare() {
    setLoadingAction("share");
    setStatus("");

    try {
      let nextShareUrl = shareUrl;

      if (!nextShareUrl) {
        const response = await fetch(`/api/entries/${entryId}/share`, {
          method: "POST"
        });
        const payload = (await response.json()) as { error?: string; url?: string };

        if (!response.ok || !payload.url) {
          throw new Error(payload.error || "生成分享链接失败。");
        }

        nextShareUrl = payload.url;
        setShareUrl(nextShareUrl);
      }

      try {
        await navigator.clipboard.writeText(nextShareUrl);
        setStatus("分享链接已复制");
      } catch {
        window.prompt("复制下面的分享链接", nextShareUrl);
        setStatus("分享链接已生成");
      }

      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "分享失败");
    } finally {
      setLoadingAction("");
      window.setTimeout(() => setStatus(""), 2400);
    }
  }

  async function handleRevoke() {
    setLoadingAction("revoke");
    setStatus("");

    try {
      const response = await fetch(`/api/entries/${entryId}/share`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "撤销分享失败。");
      }

      setShareUrl("");
      setStatus("分享已撤销");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "撤销失败");
    } finally {
      setLoadingAction("");
      window.setTimeout(() => setStatus(""), 2400);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("确定删除这条内容吗？文件也会一起删除。");

    if (!confirmed) {
      return;
    }

    setLoadingAction("delete");
    setStatus("");

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "删除失败。");
      }

      setStatus("内容已删除");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoadingAction("");
      window.setTimeout(() => setStatus(""), 2400);
    }
  }

  return (
    <div
      className={cn(
        "mt-2 flex flex-wrap items-center gap-2 text-xs",
        align === "right" ? "justify-end" : "justify-start"
      )}
    >
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={loadingAction !== ""}
        className="rounded-full border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,251,0.84))] px-3 py-1.5 font-medium text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-[1px] hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingAction === "share" ? "处理中..." : shareUrl ? "复制分享链接" : "生成分享"}
      </button>

      {shareUrl ? (
        <button
          type="button"
          onClick={() => void handleRevoke()}
          disabled={loadingAction !== ""}
          className="rounded-full border border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.92))] px-3 py-1.5 font-medium text-rose-600 shadow-[0_12px_24px_rgba(244,63,94,0.08)] transition hover:-translate-y-[1px] hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "revoke" ? "撤销中..." : "撤销分享"}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={loadingAction !== ""}
        className="rounded-full border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,251,0.84))] px-3 py-1.5 font-medium text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-[1px] hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingAction === "delete" ? "删除中..." : "删除"}
      </button>

      {status ? (
        <span className="rounded-full border border-white/70 bg-white/72 px-2.5 py-1 text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
          {status}
        </span>
      ) : null}
    </div>
  );
}
