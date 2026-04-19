"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";

type CollectionActionsProps = {
  collectionId: string;
  hasActiveShare?: boolean;
  initialDescription?: string | null;
  initialTitle: string;
};

type ShareResponse = {
  internalUrl: string | null;
  publicUrl: string | null;
};

export function CollectionActions({
  collectionId,
  hasActiveShare = false,
  initialDescription = null,
  initialTitle
}: CollectionActionsProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [description, setDescription] = useState(initialDescription || "");
  const [hasShareLink, setHasShareLink] = useState(hasActiveShare);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"delete" | "revoke" | "save" | "share_internal" | "share_public" | "">("");
  const [shareLinks, setShareLinks] = useState<ShareResponse | null>(null);
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState(initialTitle);

  function setTransientStatus(nextStatus: string) {
    setStatus(nextStatus);
    window.setTimeout(() => setStatus(""), 2600);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setTransientStatus(t("collections.title_required"));
      return;
    }

    setLoadingAction("save");
    setStatus("");

    try {
      const response = await fetch(`/api/v1/collections/${collectionId}`, {
        body: JSON.stringify({
          description,
          title
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "PATCH"
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message || t("collections.action_failed"));
      }

      setIsEditing(false);
      setTransientStatus(t("collections.updated"));
      router.refresh();
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("collections.action_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function ensureShareLinks() {
    const response = await fetch(`/api/v1/collections/${collectionId}/share`, {
      method: "POST"
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          data?: {
            share?: ShareResponse;
          };
          error?: {
            message?: string;
          };
        }
      | null;

    if (!response.ok || !payload?.data?.share) {
      throw new Error(payload?.error?.message || t("collections.action_failed"));
    }

    const nextShareLinks = {
      internalUrl: payload.data.share.internalUrl || null,
      publicUrl: payload.data.share.publicUrl || null
    };

    setHasShareLink(true);
    setShareLinks(nextShareLinks);
    router.refresh();

    return nextShareLinks;
  }

  async function copyShare(target: "internal" | "public") {
    setLoadingAction(target === "public" ? "share_public" : "share_internal");
    setStatus("");

    try {
      const nextShareLinks = shareLinks || (await ensureShareLinks());
      const nextShareUrl =
        target === "public" ? nextShareLinks.publicUrl : nextShareLinks.internalUrl;

      if (!nextShareUrl) {
        throw new Error(
          target === "internal"
            ? t("actions.internal_share_unavailable")
            : t("actions.public_share_unavailable")
        );
      }

      try {
        await navigator.clipboard.writeText(nextShareUrl);
        setTransientStatus(
          target === "public"
            ? t("actions.public_share_copied")
            : t("actions.internal_share_copied")
        );
      } catch {
        window.prompt(t("actions.copy_prompt"), nextShareUrl);
        setTransientStatus(t("actions.share_generated"));
      }
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("collections.action_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleRevoke() {
    setLoadingAction("revoke");
    setStatus("");

    try {
      const response = await fetch(`/api/v1/collections/${collectionId}/share`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message || t("collections.action_failed"));
      }

      setHasShareLink(false);
      setShareLinks(null);
      setTransientStatus(t("actions.share_revoked"));
      router.refresh();
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("collections.action_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleDelete() {
    if (!window.confirm(t("collections.confirm_delete"))) {
      return;
    }

    setLoadingAction("delete");
    setStatus("");

    try {
      const response = await fetch(`/api/v1/collections/${collectionId}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message || t("collections.action_failed"));
      }

      router.push("/collections");
      router.refresh();
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("collections.action_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          className="rounded-full border border-white/80 bg-white/86 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          {t("collections.edit")}
        </button>
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => void copyShare("public")}
          className="rounded-full border border-cyan-100/90 bg-cyan-50/85 px-3 py-1.5 text-sm font-medium text-cyan-700 transition hover:border-cyan-200 disabled:cursor-wait disabled:opacity-70"
        >
          {loadingAction === "share_public" ? t("actions.processing") : t("actions.copy_public_share")}
        </button>
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => void copyShare("internal")}
          className="rounded-full border border-slate-200/80 bg-white/86 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-cyan-200 disabled:cursor-wait disabled:opacity-70"
        >
          {loadingAction === "share_internal" ? t("actions.processing") : t("actions.copy_internal_share")}
        </button>
        {hasShareLink ? (
          <button
            type="button"
            disabled={loadingAction !== ""}
            onClick={() => void handleRevoke()}
            className="rounded-full border border-amber-100/90 bg-amber-50/85 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:border-amber-200 disabled:cursor-wait disabled:opacity-70"
          >
            {loadingAction === "revoke" ? t("actions.processing") : t("actions.revoke_share")}
          </button>
        ) : null}
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => void handleDelete()}
          className="rounded-full border border-rose-100/90 bg-rose-50/85 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:border-rose-200 disabled:cursor-wait disabled:opacity-70"
        >
          {loadingAction === "delete" ? t("actions.processing") : t("actions.delete")}
        </button>
      </div>

      {isEditing ? (
        <form
          onSubmit={(event) => void handleSave(event)}
          className="rounded-[22px] border border-white/80 bg-white/82 p-3 shadow-[0_10px_22px_rgba(15,23,42,0.04)]"
        >
          <div className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("collections.title_placeholder")}
              className="h-11 rounded-[16px] border border-slate-200/80 bg-white/92 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("collections.description_placeholder")}
              className="h-11 rounded-[16px] border border-slate-200/80 bg-white/92 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={loadingAction === "save"}
              className="rounded-full bg-[linear-gradient(135deg,#0f172a,#0f766e_58%,#38bdf8)] px-3 py-1.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(14,165,233,0.18)] transition disabled:cursor-wait disabled:opacity-70"
            >
              {loadingAction === "save" ? t("actions.processing") : t("settings.save")}
            </button>
            <button
              type="button"
              disabled={loadingAction === "save"}
              onClick={() => setIsEditing(false)}
              className="rounded-full border border-slate-200/80 bg-white/92 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-wait disabled:opacity-70"
            >
              {t("toolbar.clear")}
            </button>
          </div>
        </form>
      ) : null}

      {status ? (
        <div className="rounded-[18px] border border-white/78 bg-white/72 px-3 py-2 text-sm leading-6 text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
          {status}
        </div>
      ) : null}
    </div>
  );
}
