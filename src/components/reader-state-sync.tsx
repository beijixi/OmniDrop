"use client";

import { useEffect } from "react";

import type { ReadingState } from "@/lib/reading-states";

type ReaderStateSyncProps = {
  entryId: string;
  readingState: ReadingState;
};

export function ReaderStateSync({ entryId, readingState }: ReaderStateSyncProps) {
  useEffect(() => {
    if (readingState !== "INBOX" && readingState !== "LATER") {
      return;
    }

    void fetch(`/api/v1/entries/${entryId}`, {
      body: JSON.stringify({
        readingState: "READING"
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "PATCH"
    }).catch(() => undefined);
  }, [entryId, readingState]);

  return null;
}
