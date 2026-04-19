"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import type { DuplicateKind } from "@/lib/dedupe";
import type { DuplicateGroupAction } from "@/lib/entries";
import { cn } from "@/lib/utils";

type DuplicateGroupActionsProps = {
  count: number;
  groupKey: string;
  groupKind: DuplicateKind;
};

type DuplicateGroupKeepButtonProps = {
  count: number;
  entryId: string;
  groupKey: string;
  groupKind: DuplicateKind;
};

type ApiPayload = {
  data?: {
    deletedCount?: number;
  };
  error?: {
    message?: string;
  };
};

export function DuplicateGroupActions({
  count,
  groupKey,
  groupKind
}: DuplicateGroupActionsProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [loadingAction, setLoadingAction] = useState<DuplicateGroupAction | "">("");
  const [status, setStatus] = useState("");

  async function handleAction(action: DuplicateGroupAction) {
    const confirmed = window.confirm(t("duplicates.confirm_cleanup", { count: Math.max(count - 1, 0) }));

    if (!confirmed) {
      return;
    }

    setLoadingAction(action);
    setStatus("");

    try {
      const payload = await runDuplicateGroupAction({
        action,
        groupKey,
        groupKind
      });

      setStatus(
        (payload.data?.deletedCount || 0) > 0
          ? t("duplicates.cleanup_done", { count: payload.data?.deletedCount || 0 })
          : t("duplicates.cleanup_empty")
      );
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("duplicates.cleanup_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
        <ActionButton
          disabled={loadingAction !== ""}
          label={loadingAction === "keep_preferred" ? t("actions.processing") : t("duplicates.keep_recommended")}
          onClick={() => void handleAction("keep_preferred")}
        />
        <ActionButton
          disabled={loadingAction !== ""}
          label={loadingAction === "keep_newest" ? t("actions.processing") : t("duplicates.keep_newest")}
          onClick={() => void handleAction("keep_newest")}
        />
        <ActionButton
          disabled={loadingAction !== ""}
          label={loadingAction === "keep_oldest" ? t("actions.processing") : t("duplicates.keep_oldest")}
          onClick={() => void handleAction("keep_oldest")}
        />
      </div>

      {status ? <p className="text-xs leading-5 text-slate-500">{status}</p> : null}
    </div>
  );
}

export function DuplicateGroupKeepButton({
  count,
  entryId,
  groupKey,
  groupKind
}: DuplicateGroupKeepButtonProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);

  async function handleKeepEntry() {
    const confirmed = window.confirm(t("duplicates.confirm_cleanup", { count: Math.max(count - 1, 0) }));

    if (!confirmed) {
      return;
    }

    setIsLoading(true);

    try {
      await runDuplicateGroupAction({
        action: "keep_entry",
        entryId,
        groupKey,
        groupKind
      });
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t("duplicates.cleanup_failed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleKeepEntry()}
      disabled={isLoading}
      className={cn(
        "shrink-0 rounded-full border border-cyan-200/80 bg-cyan-50/85 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
      )}
    >
      {isLoading ? t("actions.processing") : t("duplicates.keep_this")}
    </button>
  );
}

async function runDuplicateGroupAction(input: {
  action: DuplicateGroupAction;
  entryId?: string;
  groupKey: string;
  groupKind: DuplicateKind;
}) {
  const response = await fetch("/api/v1/duplicate-groups", {
    body: JSON.stringify({
      action: input.action,
      entryId: input.entryId,
      key: input.groupKey,
      kind: input.groupKind
    }),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
  const payload = (await response.json().catch(() => null)) as ApiPayload | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Duplicate group action failed.");
  }

  return payload || {};
}

function ActionButton(input: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={input.onClick}
      disabled={input.disabled}
      className="shrink-0 rounded-full border border-white/80 bg-white/86 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {input.label}
    </button>
  );
}
