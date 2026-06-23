import type { BookCategory, BookStatus } from "@prisma/client";

export const BOOK_CATEGORIES: Array<{ value: BookCategory; label: string }> = [
  { value: "NOVEL", label: "Novel" },
  { value: "POETRY", label: "Poetry" },
  { value: "SHORT_STORY", label: "Short story" },
  { value: "ESSAY", label: "Essay" },
  { value: "CHILDREN", label: "Children's" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "BIOGRAPHY", label: "Biography" },
  { value: "DRAMA", label: "Drama" },
  { value: "OTHER", label: "Other" },
];

export const BOOK_LANGUAGES: Array<{ value: string; label: string }> = [
  { value: "si", label: "Sinhala" },
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "other", label: "Other" },
];

export const BOOK_STATUSES: Array<{ value: BookStatus; label: string }> = [
  { value: "PUBLISHED", label: "Published (visible in catalog)" },
  { value: "DRAFT", label: "Draft (hidden from members)" },
  { value: "ARCHIVED", label: "Archived (hidden from members)" },
];

export function categoryLabel(value: BookCategory): string {
  return BOOK_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function languageLabel(value: string): string {
  return BOOK_LANGUAGES.find((l) => l.value === value)?.label ?? value;
}

/** Normalize comma-separated tags: trim, lowercase, dedupe */
export function normalizeTagsInput(raw: string): string | undefined {
  const tags = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tags.length === 0) return undefined;
  return [...new Set(tags)].join(",");
}
