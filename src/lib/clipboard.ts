export async function copyTextWithFallback(
  value: string,
  input?: {
    promptLabel?: string;
  }
) {
  const normalized = value;

  if (!normalized.trim()) {
    throw new Error("COPY_EMPTY");
  }

  if (typeof window === "undefined") {
    throw new Error("COPY_UNAVAILABLE");
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(normalized);
      return "clipboard";
    } catch {
      // Fall through to legacy copy for insecure origins and mobile browsers.
    }
  }

  if (copyViaHiddenTextarea(normalized)) {
    return "legacy";
  }

  if (typeof window.prompt === "function") {
    window.prompt(input?.promptLabel || "Copy", normalized);
    return "prompt";
  }

  throw new Error("COPY_UNAVAILABLE");
}

function copyViaHiddenTextarea(value: string) {
  if (typeof document === "undefined") {
    return false;
  }

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
    activeElement?.focus();
  }

  return copied;
}
