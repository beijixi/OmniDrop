"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { cn, formatBytes, splitMessageBlocks } from "@/lib/utils";

type PendingPreview = {
  id: string;
  name: string;
  previewUrl: string | null;
  size: number;
  type: string;
};

export function Composer() {
  const router = useRouter();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PendingPreview[]>([]);
  const [dragging, setDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewportMetrics, setViewportMetrics] = useState({
    height: 0,
    keyboardInset: 0,
    offsetTop: 0
  });

  const messageCount = splitMessageBlocks(message).length;
  const sendCount = messageCount + files.length;
  const mobileTopInset = Math.max(8, viewportMetrics.offsetTop + 8);
  const mobileBottomInset = Math.max(8, viewportMetrics.keyboardInset + 8);
  const mobileSheetMaxHeight =
    viewportMetrics.height > 0
      ? Math.max(280, viewportMetrics.height - mobileTopInset - 8)
      : undefined;

  useEffect(() => {
    const nextPreviews = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      previewUrl: file.type.startsWith("image/") || file.type.startsWith("video/")
        ? URL.createObjectURL(file)
        : null,
      size: file.size,
      type: file.type
    }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => {
        if (preview.previewUrl) {
          URL.revokeObjectURL(preview.previewUrl);
        }
      });
    };
  }, [files]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    textareaRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const viewport = window.visualViewport;

    if (!viewport) {
      return;
    }

    const updateViewport = () => {
      const isCompactViewport = Math.min(window.innerWidth, viewport.width) < 640;

      if (!isCompactViewport) {
        setViewportMetrics({
          height: 0,
          keyboardInset: 0,
          offsetTop: 0
        });
        return;
      }

      const keyboardInset = Math.max(
        0,
        window.innerHeight - (viewport.height + viewport.offsetTop)
      );

      setViewportMetrics({
        height: viewport.height,
        keyboardInset,
        offsetTop: viewport.offsetTop
      });
    };

    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      setViewportMetrics({
        height: 0,
        keyboardInset: 0,
        offsetTop: 0
      });
    };
  }, [isOpen]);

  function mergeFiles(nextFiles: File[]) {
    setFiles((current) => {
      const map = new Map(
        current.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file])
      );

      nextFiles.forEach((file) => {
        map.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      });

      return [...map.values()];
    });
  }

  function clearFiles() {
    setFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(id: string) {
    setFiles((current) =>
      current.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== id)
    );
  }

  async function submitEntry() {
    if (!message.trim() && files.length === 0) {
      setError(t("composer.empty_error"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("message", message);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/v1/entries", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(payload?.error?.message || t("composer.empty_error"));
      }

      setMessage("");
      clearFiles();
      setIsOpen(false);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : t("composer.empty_error")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-[radial-gradient(circle_at_bottom,rgba(56,189,248,0.14),rgba(15,23,42,0.74))] backdrop-blur-[8px]"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

        <div className="pointer-events-none fixed inset-0 z-50">
          {isOpen ? (
          <div
            className="pointer-events-auto flex min-h-[100dvh] items-end justify-end p-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:min-h-0 sm:p-6"
            style={{
              paddingBottom: `calc(env(safe-area-inset-bottom) + ${mobileBottomInset}px)`,
              paddingTop: `calc(env(safe-area-inset-top) + ${mobileTopInset}px)`
            }}
          >
            <section
              className={cn(
                "panel-strong relative flex w-full max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[24px] pb-[max(0.7rem,env(safe-area-inset-bottom))] sm:max-h-[min(44rem,calc(100dvh-3rem))] sm:max-w-[32rem] sm:rounded-[30px]",
                dragging && "ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-100"
              )}
              style={mobileSheetMaxHeight ? { maxHeight: `${mobileSheetMaxHeight}px` } : undefined}
              onClick={(event) => event.stopPropagation()}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget === event.target) {
                  setDragging(false);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                mergeFiles([...event.dataTransfer.files]);
              }}
              onPaste={(event) => {
                const pastedFiles = [...event.clipboardData.files];

                if (pastedFiles.length > 0) {
                  event.preventDefault();
                  mergeFiles(pastedFiles);
                }
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),rgba(56,189,248,0)_62%)]" />
              <div className="pointer-events-none absolute -right-12 top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.22),rgba(20,184,166,0)_70%)] blur-2xl" />

              <div className="relative shrink-0 border-b border-white/70 px-3.5 pb-2 pt-2 sm:px-5 sm:pb-3 sm:pt-3">
                <div className="mx-auto mb-1.5 h-1.5 w-11 rounded-full bg-slate-300/80 sm:hidden" />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-slate-500 sm:text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)] shadow-[0_0_18px_rgba(20,184,166,0.42)]" />
                    <span className="truncate">
                      {sendCount > 0
                        ? t("composer.pending_count", { count: sendCount })
                        : t("composer.new_content")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="entry-icon-button"
                    aria-label={t("toolbar.collapse")}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => mergeFiles([...(event.target.files || [])])}
              />

              <div className="relative min-h-0 flex-1 overflow-y-auto px-3.5 py-3 sm:px-5 sm:py-4">
                <div className="space-y-3">
                  {previews.length > 0 ? (
                    <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
                      {previews.map((preview) => (
                        <div
                          key={preview.id}
                          className="w-[15rem] shrink-0 overflow-hidden rounded-[22px] border border-white/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,248,252,0.88))] shadow-[0_16px_36px_rgba(15,23,42,0.08)] sm:w-auto"
                        >
                          {preview.previewUrl && preview.type.startsWith("image/") ? (
                            <img
                              src={preview.previewUrl}
                              alt={preview.name}
                              className="h-32 w-full object-cover"
                            />
                          ) : null}

                          {preview.previewUrl && preview.type.startsWith("video/") ? (
                            <video
                              src={preview.previewUrl}
                              className="h-32 w-full bg-slate-950 object-cover"
                              muted
                              playsInline
                            />
                          ) : null}

                          {!preview.previewUrl ? (
                            <div className="flex h-32 items-center justify-center bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,118,110,0.82))] text-sm font-medium text-white">
                              {t("composer.pending_file")}
                            </div>
                          ) : null}

                          <div className="flex items-start justify-between gap-3 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {preview.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {preview.type || "application/octet-stream"} · {formatBytes(preview.size)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(preview.id)}
                              className="entry-icon-button h-8 w-8"
                              aria-label={t("composer.remove")}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-white/68 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,247,251,0.46))] px-4 py-5 text-center text-sm leading-6 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_28px_rgba(15,23,42,0.05)]">
                      {t("composer.placeholder")}
                    </div>
                  )}

                  {error ? <p className="px-1 text-sm text-rose-600">{error}</p> : null}
                </div>
              </div>

              <div className="sticky bottom-0 -mx-3.5 border-t border-white/70 bg-[linear-gradient(180deg,rgba(243,247,251,0),rgba(243,247,251,0.88)_20%,rgba(243,247,251,0.98))] px-3.5 pb-1 pt-2.5 backdrop-blur sm:-mx-5 sm:px-5 sm:pt-3">
                <div className="rounded-[26px] border border-slate-900/14 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.84)_18%,rgba(15,118,110,0.8)_100%)] p-2 shadow-[0_24px_52px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.16)]">
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/16 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:border-white/32"
                      aria-label={t("composer.add_files")}
                    >
                      <AttachIcon />
                    </button>

                    <div className="min-w-0 flex-1 rounded-[20px] border border-white/12 bg-white/10 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                            event.preventDefault();
                            void submitEntry();
                          }
                        }}
                        rows={2}
                        placeholder={t("composer.placeholder")}
                        className="min-h-[52px] max-h-[132px] w-full resize-none bg-transparent py-3 text-[15px] leading-6 text-white outline-none placeholder:text-white/48"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void submitEntry()}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_14px_28px_rgba(255,255,255,0.22)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={isSubmitting ? t("composer.sending") : t("composer.send")}
                      title={isSubmitting ? t("composer.sending") : t("composer.send")}
                    >
                      <SendIconSolid />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    {sendCount > 0 ? (
                      <span className="message-meta-pill rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {t("composer.pending_count", { count: sendCount })}
                      </span>
                    ) : null}
                  </div>

                  {files.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearFiles}
                      className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      {t("composer.clear_files")}
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        ) : null}

        <div className="pointer-events-none fixed bottom-4 right-4 sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#0f172a,#0f766e_58%,#38bdf8)] text-white shadow-[0_24px_54px_rgba(15,23,42,0.28)] transition hover:-translate-y-[2px] sm:h-[4.4rem] sm:w-[4.4rem] sm:rounded-[26px]"
            aria-label={t("composer.open")}
          >
            <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.34),rgba(255,255,255,0)_58%)]" />
            <span className="pointer-events-none absolute -inset-1 -z-10 rounded-[26px] bg-[radial-gradient(circle,rgba(56,189,248,0.36),rgba(56,189,248,0)_70%)] blur-xl" />
            <PlusIcon />
          </button>
        </div>
      </div>
    </>
  );
}

function AttachIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15.5 7.5-5.96 5.96a2.5 2.5 0 1 0 3.54 3.54l7.08-7.08a4.5 4.5 0 0 0-6.36-6.36L5.66 11.7a6.5 6.5 0 0 0 9.2 9.2l5.3-5.3"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14m-10 0V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7m-8.6 0 .7 10.2A1.8 1.8 0 0 0 8.9 19h6.2a1.8 1.8 0 0 0 1.8-1.8L17.6 7M10 10.5v4.5M14 10.5v4.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SendIconSolid() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12 19 5l-4.4 14-2.7-5.1L5 12Z" />
    </svg>
  );
}
