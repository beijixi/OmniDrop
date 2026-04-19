"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

type EntryActionsProps = {
  align?: "left" | "right";
  duplicateCount?: number;
  entryId: string;
  hasActiveShare?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  isPinned?: boolean;
  inline?: boolean;
  messageText?: string | null;
};

type ShareResponse = {
  internalUrl: string | null;
  publicUrl: string | null;
};

export function EntryActions({
  align = "left",
  duplicateCount = 0,
  entryId,
  hasActiveShare = false,
  isArchived = false,
  isFavorite = false,
  isPinned = false,
  inline = false,
  messageText = null
}: EntryActionsProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [shareLinks, setShareLinks] = useState<ShareResponse | null>(null);
  const [hasShareLink, setHasShareLink] = useState(hasActiveShare);
  const [favorite, setFavorite] = useState(isFavorite);
  const [archived, setArchived] = useState(isArchived);
  const [pinned, setPinned] = useState(isPinned);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [loadingAction, setLoadingAction] = useState<
    | "archive"
    | "cleanup_duplicates"
    | "delete"
    | "favorite"
    | "pin"
    | "revoke"
    | "share_public"
    | "share_internal"
    | ""
  >("");

  useEffect(() => {
    setHasShareLink(hasActiveShare);

    if (!hasActiveShare) {
      setShareLinks(null);
    }
  }, [hasActiveShare]);

  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  useEffect(() => {
    setArchived(isArchived);
  }, [isArchived]);

  useEffect(() => {
    setPinned(isPinned);
  }, [isPinned]);

  function setTransientStatus(nextStatus: string) {
    setStatus(nextStatus);
    window.setTimeout(() => setStatus(""), 2400);
  }

  async function ensureShareLinks() {
    const response = await fetch(`/api/v1/entries/${entryId}/share`, {
      method: "POST"
    });
    const payload = (await response.json()) as {
      data?: {
        share?: ShareResponse;
      };
      error?: {
        message?: string;
      };
    };

    if (!response.ok || !payload.data?.share) {
      throw new Error(payload.error?.message || t("actions.share_failed"));
    }

    const nextShareLinks: ShareResponse = {
      internalUrl: payload.data.share.internalUrl || null,
      publicUrl: payload.data.share.publicUrl || null
    };

    setShareLinks(nextShareLinks);
    setHasShareLink(true);
    router.refresh();

    return nextShareLinks;
  }

  async function copyShare(target: "public" | "internal") {
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
      setTransientStatus(error instanceof Error ? error.message : t("actions.share_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleRevoke() {
    setLoadingAction("revoke");
    setStatus("");

    try {
      const response = await fetch(`/api/v1/entries/${entryId}/share`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message || t("actions.revoke_failed"));
      }

      setHasShareLink(false);
      setShareLinks(null);
      setTransientStatus(t("actions.share_revoked"));
      router.refresh();
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("actions.revoke_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(t("actions.confirm_delete"));

    if (!confirmed) {
      return;
    }

    setLoadingAction("delete");
    setStatus("");

    try {
      const response = await fetch(`/api/v1/entries/${entryId}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message || t("actions.delete_failed"));
      }

      setTransientStatus(t("actions.deleted"));
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("actions.delete_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleCopyText() {
    if (!messageText) {
      return;
    }

    setStatus("");

    try {
      await navigator.clipboard.writeText(messageText);
      setTransientStatus(t("actions.text_copied"));
    } catch {
      setTransientStatus(t("actions.copy_failed"));
    }
  }

  async function updateEntryState(input: {
    archived?: boolean;
    favorite?: boolean;
    pinned?: boolean;
  }) {
    const response = await fetch(`/api/v1/entries/${entryId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(input)
    });
    const payload = (await response.json()) as {
      data?: {
        entry?: {
          archivedAt?: string | null;
          isFavorite?: boolean;
          pinnedAt?: string | null;
        };
      };
      error?: {
        message?: string;
      };
    };

    if (!response.ok || !payload.data?.entry) {
      throw new Error(
        payload.error?.message ||
          (typeof input.archived === "boolean"
            ? t("actions.archive_failed")
            : typeof input.pinned === "boolean"
              ? t("actions.pin_failed")
            : t("actions.favorite_failed"))
      );
    }

    setFavorite(Boolean(payload.data.entry.isFavorite));
    setArchived(Boolean(payload.data.entry.archivedAt));
    setPinned(Boolean(payload.data.entry.pinnedAt));
    router.refresh();
  }

  async function handleFavoriteToggle() {
    const nextFavorite = !favorite;

    setLoadingAction("favorite");
    setStatus("");

    try {
      await updateEntryState({
        favorite: nextFavorite
      });
      setTransientStatus(
        nextFavorite ? t("actions.favorite_added") : t("actions.favorite_removed")
      );
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("actions.favorite_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleArchiveToggle() {
    const nextArchived = !archived;

    setLoadingAction("archive");
    setStatus("");

    try {
      await updateEntryState({
        archived: nextArchived
      });
      setTransientStatus(nextArchived ? t("actions.archived") : t("actions.unarchived"));
      setIsOpen(false);
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("actions.archive_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handlePinToggle() {
    const nextPinned = !pinned;

    setLoadingAction("pin");
    setStatus("");

    try {
      await updateEntryState({
        pinned: nextPinned
      });
      setTransientStatus(nextPinned ? t("actions.pinned") : t("actions.unpinned"));
      setIsOpen(false);
    } catch (error) {
      setTransientStatus(error instanceof Error ? error.message : t("actions.pin_failed"));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleCleanupDuplicates() {
    if (!window.confirm(t("actions.confirm_cleanup_duplicates"))) {
      return;
    }

    setLoadingAction("cleanup_duplicates");
    setStatus("");

    try {
      const response = await fetch(`/api/v1/entries/${entryId}`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          action: "cleanup_duplicates"
        })
      });
      const payload = (await response.json()) as {
        data?: {
          deletedCount?: number;
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message || t("actions.cleanup_duplicates_failed"));
      }

      const deletedCount = payload.data?.deletedCount || 0;
      setTransientStatus(
        deletedCount > 0
          ? t("actions.cleanup_duplicates_done", { count: deletedCount })
          : t("actions.cleanup_duplicates_empty")
      );
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      setTransientStatus(
        error instanceof Error ? error.message : t("actions.cleanup_duplicates_failed")
      );
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div
      className={cn(
        inline
          ? "relative shrink-0 pt-0.5"
          : cn("mt-2 flex", align === "right" ? "justify-end" : "justify-start")
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={cn("entry-icon-button", inline && "h-8 w-8 opacity-80")}
          aria-expanded={isOpen}
          aria-label={t("actions.more")}
          title={t("actions.more")}
        >
          <MoreIcon />
        </button>

        {isOpen ? (
          <div
            className={cn(
              "entry-action-panel absolute top-full z-20 mt-2 w-[15rem] rounded-[24px] p-2 sm:w-[16.5rem]",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            <div className="space-y-1">
              <ActionMenuButton
                icon={<PinIcon active={pinned} />}
                label={pinned ? t("actions.unpin") : t("actions.pin")}
                loading={loadingAction === "pin"}
                onClick={() => void handlePinToggle()}
              />
              <ActionMenuButton
                icon={<StarIcon active={favorite} />}
                label={favorite ? t("actions.unfavorite") : t("actions.favorite")}
                loading={loadingAction === "favorite"}
                onClick={() => void handleFavoriteToggle()}
              />
              <ActionMenuButton
                icon={archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                label={archived ? t("actions.unarchive") : t("actions.archive")}
                loading={loadingAction === "archive"}
                onClick={() => void handleArchiveToggle()}
              />

              <div className="my-2 h-px bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(203,213,225,0.9),rgba(226,232,240,0))]" />

              {messageText ? (
                <ActionMenuButton
                  icon={<CopyIcon />}
                  label={t("actions.copy_text")}
                  onClick={() => void handleCopyText()}
                />
              ) : null}

              {duplicateCount > 1 ? (
                <ActionMenuButton
                  icon={<SparklesBroomIcon />}
                  label={t("actions.cleanup_duplicates")}
                  loading={loadingAction === "cleanup_duplicates"}
                  onClick={() => void handleCleanupDuplicates()}
                />
              ) : null}

              <ActionMenuButton
                icon={<GlobeIcon />}
                label={t("actions.copy_public_share")}
                loading={loadingAction === "share_public"}
                onClick={() => void copyShare("public")}
              />
              <ActionMenuButton
                icon={<HomeIcon />}
                label={t("actions.copy_internal_share")}
                loading={loadingAction === "share_internal"}
                onClick={() => void copyShare("internal")}
              />
            </div>

            <div className="my-2 h-px bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(203,213,225,0.9),rgba(226,232,240,0))]" />

            <div className="space-y-1">
              {hasShareLink ? (
                <ActionMenuButton
                  icon={<UndoIcon />}
                  label={t("actions.revoke_share")}
                  loading={loadingAction === "revoke"}
                  onClick={() => void handleRevoke()}
                />
              ) : null}

              <ActionMenuButton
                icon={<TrashIcon />}
                label={t("actions.delete")}
                loading={loadingAction === "delete"}
                danger
                onClick={() => void handleDelete()}
              />
            </div>

            {status ? (
              <div className="mt-2 rounded-[18px] border border-white/78 bg-white/72 px-3 py-2 text-xs leading-5 text-slate-500 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                {status}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ActionMenuButtonProps = {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  loading?: boolean;
  onClick: () => void;
};

function ActionMenuButton({
  danger = false,
  icon,
  label,
  loading = false,
  onClick
}: ActionMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        danger
          ? "text-rose-600 hover:bg-rose-50/80"
          : "text-slate-700 hover:bg-white/80"
      )}
    >
      <span
        className={cn(
          "entry-icon-button h-8 w-8 shrink-0",
          danger && "text-rose-600 hover:text-rose-600"
        )}
      >
        {loading ? <SpinnerIcon /> : icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
      <circle cx="4" cy="10" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="16" cy="10" r="1.6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6.5" y="6.5" width="8.5" height="8.5" rx="2" />
      <path strokeLinecap="round" d="M5 11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function StarIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m10 2.9 2.1 4.3 4.8.7-3.4 3.3.8 4.7-4.3-2.3-4.3 2.3.8-4.7L3.1 7.9l4.8-.7L10 2.9Z"
      />
    </svg>
  );
}

function PinIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12.2 3.4 4.4 4.4-2.2 1.2-.8 4.4-1.7-1.7-3.8 3.8-.9-.9 3.8-3.8-1.7-1.7 4.4-.8 1.2-2.2-4.4-4.4"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="10" r="6.8" />
      <path strokeLinecap="round" d="M3.2 10h13.6M10 3.2c1.8 2 2.7 4.3 2.7 6.8S11.8 14.8 10 16.8m0-13.6c-1.8 2-2.7 4.3-2.7 6.8S8.2 14.8 10 16.8" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.4 8.2 10 3.9l5.6 4.3V15a1.2 1.2 0 0 1-1.2 1.2H5.6A1.2 1.2 0 0 1 4.4 15V8.2Z" />
      <path strokeLinecap="round" d="M8.1 16.2v-4.1a.9.9 0 0 1 .9-.9h2a.9.9 0 0 1 .9.9v4.1" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.1 6.9V3.8L2.6 6.3l2.5 2.5V6.9H11a4.2 4.2 0 0 1 0 8.4H7.4" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.4 5.4h13.2v3.2H3.4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.6 8.6h10.8v6.2a1.2 1.2 0 0 1-1.2 1.2H5.8a1.2 1.2 0 0 1-1.2-1.2V8.6Z" />
      <path strokeLinecap="round" d="M7.4 11h5.2" />
    </svg>
  );
}

function ArchiveRestoreIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.4 5.4h13.2v3.2H3.4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.6 8.6h10.8v6.2a1.2 1.2 0 0 1-1.2 1.2H5.8a1.2 1.2 0 0 1-1.2-1.2V8.6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m10 12.9 2.3-2.3M10 12.9l-2.3-2.3M10 12.9V9.3" />
    </svg>
  );
}

function SparklesBroomIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.7 4.2 4.1 4.1m-7.2 1 5.1-5.1 2.1 2.1-5.1 5.1-3.2 1.1 1.1-3.2Z" />
      <path strokeLinecap="round" d="M4.4 4.3v2.4M3.2 5.5h2.4M4.7 12.7v1.8M3.8 13.6h1.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.8 5.8h10.4M8 5.8V4.7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.1m-6.2 0 .6 9a1.2 1.2 0 0 0 1.2 1.1h4.8a1.2 1.2 0 0 0 1.2-1.1l.6-9" />
      <path strokeLinecap="round" d="M8.5 9.1v4.3M11.5 9.1v4.3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M10 3a7 7 0 1 0 7 7" />
    </svg>
  );
}
