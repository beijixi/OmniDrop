"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

type SharedButtonProps = {
  className?: string;
};

type CopyTextButtonProps = SharedButtonProps & {
  copiedLabel?: string;
  idleLabel?: string;
  value: string;
};

type CopyImageButtonProps = SharedButtonProps & {
  mimeType: string;
  src: string;
};

export function CopyTextButton({
  value,
  className,
  copiedLabel,
  idleLabel
}: CopyTextButtonProps) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function handleCopy() {
    setState("busy");

    try {
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("error");
    } finally {
      window.setTimeout(() => setState("idle"), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn("entry-icon-button", className)}
      disabled={state === "busy"}
      aria-label={labelForTextState(state, t, idleLabel, copiedLabel)}
      title={labelForTextState(state, t, idleLabel, copiedLabel)}
    >
      {renderIcon(state, <CopyIcon />)}
    </button>
  );
}

export function CopyImageButton({ src, mimeType, className }: CopyImageButtonProps) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function handleCopy() {
    setState("busy");

    try {
      if (
        typeof window === "undefined" ||
        !navigator.clipboard ||
        typeof window.ClipboardItem === "undefined"
      ) {
        throw new Error("CLIPBOARD_UNSUPPORTED");
      }

      const response = await fetch(src, {
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error("IMAGE_FETCH_FAILED");
      }

      const blob = await response.blob();
      const normalizedMimeType = blob.type || mimeType || "image/png";

      await navigator.clipboard.write([
        new window.ClipboardItem({
          [normalizedMimeType]: blob
        })
      ]);

      setState("done");
    } catch {
      setState("error");
    } finally {
      window.setTimeout(() => setState("idle"), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn("entry-icon-button", className)}
      disabled={state === "busy"}
      aria-label={labelForImageState(state, t)}
      title={labelForImageState(state, t)}
    >
      {renderIcon(state, <ImageCopyIcon />)}
    </button>
  );
}

function renderIcon(state: "idle" | "busy" | "done" | "error", idleIcon: ReactNode) {
  if (state === "busy") {
    return <SpinnerIcon />;
  }

  if (state === "done") {
    return <SuccessIcon />;
  }

  if (state === "error") {
    return <ErrorIcon />;
  }

  return idleIcon;
}

function labelForTextState(
  state: "idle" | "busy" | "done" | "error",
  t: ReturnType<typeof useI18n>["t"],
  idleLabel?: string,
  copiedLabel?: string
) {
  if (state === "busy") {
    return t("actions.processing");
  }

  if (state === "done") {
    return copiedLabel || t("actions.text_copied");
  }

  if (state === "error") {
    return t("actions.copy_failed");
  }

  return idleLabel || t("actions.copy_text");
}

function labelForImageState(
  state: "idle" | "busy" | "done" | "error",
  t: ReturnType<typeof useI18n>["t"]
) {
  if (state === "busy") {
    return t("actions.processing");
  }

  if (state === "done") {
    return t("actions.image_copied");
  }

  if (state === "error") {
    return t("actions.copy_failed");
  }

  return t("actions.copy_image");
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6.5" y="6.5" width="8.5" height="8.5" rx="2" />
      <path strokeLinecap="round" d="M5 11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ImageCopyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="10" height="10" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.8 11 2.3-2.4 2.1 2 1.3-1.3 1.5 1.7" />
      <path strokeLinecap="round" d="M9.5 3h5a2 2 0 0 1 2 2v5" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 10.2 3.3 3.3 7.4-7.7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="m6 6 8 8M14 6l-8 8" />
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
