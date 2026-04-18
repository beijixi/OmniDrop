export const entryViewOptions = ["ACTIVE", "FAVORITES", "ARCHIVED", "ALL"] as const;

export type EntryView = (typeof entryViewOptions)[number];

export function isEntryView(value?: string | null): value is EntryView {
  return !!value && entryViewOptions.includes(value as EntryView);
}

export function normalizeEntryView(value?: string | null): EntryView {
  return isEntryView(value) ? value : "ACTIVE";
}
