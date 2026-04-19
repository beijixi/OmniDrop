"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import type { EntryBatchAction } from "@/lib/entries";
import { cn } from "@/lib/utils";

type BulkSelectionContextValue = {
  enterSelectionMode: (entryId?: string) => void;
  isSelected: (entryId: string) => boolean;
  selectionMode: boolean;
  toggleSelection: (entryId: string) => void;
};

const BulkSelectionContext = createContext<BulkSelectionContextValue | null>(null);

type BulkSelectionTimelineProps = {
  children: ReactNode;
  entryIds: string[];
};

type BatchActionPayload = {
  changedCount?: number;
  matchedCount?: number;
};

const batchActions: EntryBatchAction[] = [
  "pin",
  "unpin",
  "favorite",
  "unfavorite",
  "archive",
  "unarchive",
  "delete"
];

const actionLabelKeys: Record<EntryBatchAction, Parameters<ReturnType<typeof useI18n>["t"]>[0]> = {
  archive: "actions.archive",
  delete: "actions.delete",
  favorite: "actions.favorite",
  pin: "actions.pin",
  unarchive: "actions.unarchive",
  unfavorite: "actions.unfavorite",
  unpin: "actions.unpin"
};

export function BulkSelectionTimeline({ children, entryIds }: BulkSelectionTimelineProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<EntryBatchAction | "">("");
  const [status, setStatus] = useState("");
  const statusTimeoutRef = useRef<number | null>(null);
  const selectedIdSet = new Set(selectedIds);
  const selectedCount = selectedIds.length;
  const allVisibleSelected = entryIds.length > 0 && selectedCount === entryIds.length;

  useEffect(() => {
    const visibleIdSet = new Set(entryIds);

    setSelectedIds((current) => current.filter((entryId) => visibleIdSet.has(entryId)));

    if (entryIds.length === 0) {
      setSelectionMode(false);
    }
  }, [entryIds]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  function setTransientStatus(nextStatus: string) {
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current);
    }

    setStatus(nextStatus);
    statusTimeoutRef.current = window.setTimeout(() => setStatus(""), 2600);
  }

  function enterSelectionMode(entryId?: string) {
    setSelectionMode(true);

    if (entryId) {
      setSelectedIds((current) => (current.includes(entryId) ? current : [...current, entryId]));
    }
  }

  function toggleSelection(entryId: string) {
    setSelectionMode(true);
    setSelectedIds((current) =>
      current.includes(entryId)
        ? current.filter((currentEntryId) => currentEntryId !== entryId)
        : [...current, entryId]
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function exitSelectionMode() {
    setSelectedIds([]);
    setSelectionMode(false);
  }

  function selectAllVisible() {
    setSelectionMode(true);
    setSelectedIds(entryIds);
  }

  async function handleBatchAction(action: EntryBatchAction) {
    if (selectedIds.length === 0) {
      setTransientStatus(t("actions.batch_empty"));
      return;
    }

    if (action === "delete" && !window.confirm(t("actions.confirm_batch_delete", { count: selectedIds.length }))) {
      return;
    }

    setPendingAction(action);
    setStatus("");

    try {
      const response = await fetch("/api/v1/entries/batch", {
        body: JSON.stringify({
          action,
          ids: selectedIds
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            data?: BatchActionPayload;
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message || t("actions.batch_failed"));
      }

      const matchedCount = payload?.data?.matchedCount || selectedIds.length;

      setSelectedIds([]);
      setTransientStatus(getBatchSuccessMessage(t, action, matchedCount));
      router.refresh();
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("actions.batch_failed"));
    } finally {
      setPendingAction("");
    }
  }

  return (
    <BulkSelectionContext.Provider
      value={{
        enterSelectionMode,
        isSelected: (entryId) => selectedIdSet.has(entryId),
        selectionMode,
        toggleSelection
      }}
    >
      <section className="panel relative mb-4 overflow-hidden px-3 py-3 sm:px-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(90deg,rgba(14,165,233,0),rgba(14,165,233,0.12),rgba(20,184,166,0.16),rgba(14,165,233,0))]" />

        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {selectionMode
                  ? t("toolbar.selection_count", { count: selectedCount })
                  : t("toolbar.organize")}
              </p>
              <p className="mt-1 text-xs text-slate-500">{t("toolbar.long_press_hint")}</p>
            </div>

            {!selectionMode ? (
              <button
                type="button"
                onClick={() => enterSelectionMode()}
                className="rounded-full border border-cyan-200/80 bg-cyan-50/85 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:text-cyan-800"
              >
                {t("toolbar.organize")}
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectAllVisible()}
                  disabled={allVisibleSelected}
                  className="rounded-full border border-white/80 bg-white/82 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {t("toolbar.select_all_visible")}
                </button>
                <button
                  type="button"
                  onClick={() => clearSelection()}
                  className="rounded-full border border-white/80 bg-white/82 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300"
                >
                  {t("toolbar.clear_selection")}
                </button>
                <button
                  type="button"
                  onClick={() => exitSelectionMode()}
                  className="rounded-full border border-rose-100/90 bg-rose-50/85 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:border-rose-200"
                >
                  {t("toolbar.exit_selection")}
                </button>
              </div>
            )}
          </div>

          {selectionMode ? (
            <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
              {batchActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={pendingAction !== "" || selectedCount === 0}
                  onClick={() => void handleBatchAction(action)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                    action === "delete"
                      ? "border-rose-100/90 bg-rose-50/80 text-rose-600 hover:border-rose-200"
                      : "border-white/80 bg-white/82 text-slate-700 hover:border-cyan-200 hover:text-cyan-700"
                  )}
                >
                  {pendingAction === action ? t("actions.processing") : t(actionLabelKeys[action])}
                </button>
              ))}
            </div>
          ) : null}

          {status ? (
            <div className="rounded-[18px] border border-white/78 bg-white/72 px-3 py-2 text-sm leading-6 text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
              {status}
            </div>
          ) : null}
        </div>
      </section>

      {children}
    </BulkSelectionContext.Provider>
  );
}

type SelectableEntryShellProps = {
  children: ReactNode;
  entryId: string;
};

export function SelectableEntryShell({ children, entryId }: SelectableEntryShellProps) {
  const { t } = useI18n();
  const { enterSelectionMode, isSelected, selectionMode, toggleSelection } = useBulkSelection();
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null);
  const selected = isSelected(entryId);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  function clearLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    pointerOriginRef.current = null;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (selectionMode || event.pointerType !== "touch") {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element) || target.closest("a,button,input,textarea,select,label,summary")) {
      return;
    }

    longPressTriggeredRef.current = false;
    pointerOriginRef.current = {
      x: event.clientX,
      y: event.clientY
    };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      enterSelectionMode(entryId);
    }, 360);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointerOriginRef.current) {
      return;
    }

    const deltaX = Math.abs(event.clientX - pointerOriginRef.current.x);
    const deltaY = Math.abs(event.clientY - pointerOriginRef.current.y);

    if (deltaX > 10 || deltaY > 10) {
      clearLongPress();
    }
  }

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!longPressTriggeredRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    longPressTriggeredRef.current = false;
  }

  return (
    <div
      className={cn(
        "relative rounded-[30px] transition",
        selectionMode && "bg-white/48 ring-1 ring-white/80 ring-offset-2 ring-offset-slate-50",
        selected && "bg-cyan-50/78 ring-2 ring-cyan-300 shadow-[0_18px_36px_rgba(14,165,233,0.12)]"
      )}
      onClickCapture={handleClickCapture}
      onPointerCancel={clearLongPress}
      onPointerDown={handlePointerDown}
      onPointerLeave={clearLongPress}
      onPointerMove={handlePointerMove}
      onPointerUp={clearLongPress}
    >
      {selectionMode ? (
        <>
          <button
            type="button"
            onClick={() => toggleSelection(entryId)}
            className="absolute inset-0 z-10 rounded-[30px]"
            aria-pressed={selected}
            aria-label={selected ? t("actions.deselect_item") : t("actions.select_item")}
          />
          <button
            type="button"
            onClick={() => toggleSelection(entryId)}
            className={cn(
              "absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition",
              selected
                ? "border-cyan-400 bg-cyan-500 text-white"
                : "border-white/90 bg-white/92 text-slate-500 hover:border-cyan-200 hover:text-cyan-700"
            )}
            aria-hidden="true"
            tabIndex={-1}
          >
            {selected ? "✓" : ""}
          </button>
        </>
      ) : null}

      <div className={cn(selectionMode && "pointer-events-none select-none")}>{children}</div>
    </div>
  );
}

function useBulkSelection() {
  const context = useContext(BulkSelectionContext);

  if (!context) {
    throw new Error("BulkSelectionTimeline is missing.");
  }

  return context;
}

function getBatchSuccessMessage(
  t: ReturnType<typeof useI18n>["t"],
  action: EntryBatchAction,
  count: number
) {
  switch (action) {
    case "pin":
      return t("actions.batch_pinned", { count });
    case "unpin":
      return t("actions.batch_unpinned", { count });
    case "favorite":
      return t("actions.batch_favorited", { count });
    case "unfavorite":
      return t("actions.batch_unfavorited", { count });
    case "archive":
      return t("actions.batch_archived", { count });
    case "unarchive":
      return t("actions.batch_unarchived", { count });
    case "delete":
      return t("actions.batch_deleted", { count });
    default:
      return t("actions.batch_failed");
  }
}
