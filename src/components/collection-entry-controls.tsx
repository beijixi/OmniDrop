"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

type CollectionEntryControlsProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  children: ReactNode;
  collectionId: string;
  entryId: string;
};

export function CollectionEntryControls({
  canMoveDown,
  canMoveUp,
  children,
  collectionId,
  entryId
}: CollectionEntryControlsProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [loadingAction, setLoadingAction] = useState<"down" | "remove" | "up" | "">("");
  const [status, setStatus] = useState("");

  function setTransientStatus(nextStatus: string) {
    setStatus(nextStatus);
    window.setTimeout(() => setStatus(""), 2200);
  }

  async function handleMove(direction: "down" | "up") {
    setLoadingAction(direction);
    setStatus("");

    try {
      const response = await fetch(`/api/v1/collections/${collectionId}/entries/${entryId}`, {
        body: JSON.stringify({
          direction
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

      router.refresh();
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("collections.action_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleRemove() {
    if (!window.confirm(t("collections.confirm_remove_entry"))) {
      return;
    }

    setLoadingAction("remove");
    setStatus("");

    try {
      const response = await fetch(`/api/v1/collections/${collectionId}/entries/${entryId}`, {
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

      router.refresh();
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("collections.action_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="space-y-2">
      {children}
      <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-14">
        <button
          type="button"
          disabled={!canMoveUp || loadingAction !== ""}
          onClick={() => void handleMove("up")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
            "border-white/80 bg-white/84 text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
          )}
        >
          {loadingAction === "up" ? t("actions.processing") : t("collections.move_up")}
        </button>
        <button
          type="button"
          disabled={!canMoveDown || loadingAction !== ""}
          onClick={() => void handleMove("down")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
            "border-white/80 bg-white/84 text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
          )}
        >
          {loadingAction === "down" ? t("actions.processing") : t("collections.move_down")}
        </button>
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => void handleRemove()}
          className="rounded-full border border-rose-100/90 bg-rose-50/85 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:border-rose-200 disabled:cursor-wait disabled:opacity-70"
        >
          {loadingAction === "remove" ? t("actions.processing") : t("collections.remove_entry")}
        </button>
      </div>
      {status ? (
        <div className="pl-12 text-sm leading-6 text-slate-500 sm:pl-14">{status}</div>
      ) : null}
    </div>
  );
}
