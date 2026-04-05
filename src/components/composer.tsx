"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PendingPreview[]>([]);
  const [dragging, setDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messageCount = splitMessageBlocks(message).length;
  const sendCount = messageCount + files.length;

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
      setError("请输入文本，或者添加至少一个文件。");
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

      const response = await fetch("/api/entries", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "保存失败，请稍后重试。");
      }

      setMessage("");
      clearFiles();
      setIsOpen(false);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "保存失败，请稍后重试。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/38 backdrop-blur-[3px]"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-2 sm:px-5 sm:pb-5">
        <div className="mx-auto max-w-5xl">
          {isOpen ? (
            <section
              className={cn(
                "pointer-events-auto panel-strong relative overflow-hidden",
                dragging && "ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-100"
              )}
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
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.2),rgba(20,184,166,0)_60%)]" />
              <div className="pointer-events-none absolute -right-12 top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22),rgba(56,189,248,0)_70%)] blur-2xl" />

              <div className="relative border-b border-white/70 px-4 py-3 sm:px-5">
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-300/80" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/75 bg-white/72 px-3 py-1 text-xs font-semibold text-slate-700">
                        新内容
                      </span>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                        {sendCount > 0 ? `${sendCount} 条待发送` : "准备发送"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      文本按空行拆分，文件逐条发送，拖拽、粘贴、选择都可以。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="glass-button inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:text-slate-900"
                    aria-label="收起输入器"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className="relative space-y-4 px-4 py-4 sm:px-5">
                <div className="spotlight-ring rounded-[32px] border border-white/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,247,251,0.88))] p-2">
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
                    rows={5}
                    placeholder="发一段文字，拖进来几张图，或者直接粘贴截图..."
                    className="min-h-[132px] w-full resize-none rounded-[26px] bg-transparent px-4 py-4 text-[15px] leading-7 text-slate-900 outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-white/72 bg-white/76 px-3 py-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                    文本和文件共用一个输入器
                  </span>
                  <span className="rounded-full border border-white/72 bg-white/76 px-3 py-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                    快捷键 Ctrl/Cmd + Enter
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => mergeFiles([...(event.target.files || [])])}
                />

                {previews.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {previews.map((preview) => (
                      <div
                        key={preview.id}
                        className="overflow-hidden rounded-[30px] border border-white/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,247,251,0.86))] shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
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
                            文件待发送
                          </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {preview.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {preview.type || "application/octet-stream"} ·{" "}
                              {formatBytes(preview.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(preview.id)}
                            className="rounded-full border border-slate-200/85 px-3 py-1 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-[1px] hover:text-slate-900"
                    >
                      <AttachIcon />
                      添加文件
                    </button>
                    {files.length > 0 ? (
                      <button
                        type="button"
                        onClick={clearFiles}
                        className="inline-flex items-center rounded-full border border-white/72 bg-white/76 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        清空附件
                      </button>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void submitEntry()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#0f172a,#0f766e_58%,#38bdf8)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SendIcon />
                    {isSubmitting
                      ? "发送中..."
                      : sendCount > 1
                        ? `发送 ${sendCount} 条`
                        : "发送"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto mt-3 w-full rounded-[32px] bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,118,110,0.92),rgba(56,189,248,0.88))] p-[1px] text-left shadow-[0_24px_50px_rgba(15,23,42,0.22)] transition hover:-translate-y-[1px]"
          >
            <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-[31px] bg-[linear-gradient(135deg,rgba(5,10,24,0.96),rgba(13,23,42,0.94))] px-4 py-3 text-white">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-[radial-gradient(circle_at_left,rgba(20,184,166,0.24),rgba(20,184,166,0)_72%)]" />
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#14b8a6,#38bdf8)] text-white shadow-[0_14px_30px_rgba(56,189,248,0.28)]">
                  <PlusIcon />
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold sm:text-[15px]">
                    发消息、传文件、贴截图
                  </p>
                  <p className="truncate text-xs text-white/65">
                    点击展开输入器，把新的内容丢进时间流
                  </p>
                </div>
              </div>

              <span className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/88 backdrop-blur">
                打开
              </span>
            </div>
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12 20 4l-4 16-3.5-6.5L4 12Z" />
    </svg>
  );
}
