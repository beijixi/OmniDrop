export const readingStateOptions = ["INBOX", "LATER", "READING", "DONE"] as const;

export type ReadingState = (typeof readingStateOptions)[number];

export const readingStateFilterOptions = ["INBOX", "LATER", "READING", "DONE", "ALL"] as const;

export type ReadingStateFilter = (typeof readingStateFilterOptions)[number];

export function isReadingState(value?: string | null): value is ReadingState {
  return !!value && readingStateOptions.includes(value as ReadingState);
}

export function normalizeReadingState(
  value?: string | null,
  fallback: ReadingState = "INBOX"
): ReadingState {
  return isReadingState(value) ? value : fallback;
}

export function isReadingStateFilter(value?: string | null): value is ReadingStateFilter {
  return !!value && readingStateFilterOptions.includes(value as ReadingStateFilter);
}

export function normalizeReadingStateFilter(
  value?: string | null,
  fallback: ReadingStateFilter = "INBOX"
): ReadingStateFilter {
  return isReadingStateFilter(value) ? value : fallback;
}
