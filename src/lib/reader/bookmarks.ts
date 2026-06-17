import type { ReaderBookmark } from "@/lib/reader/types";

function storageKey(bookId: string): string {
  return `ebooks-lk-bookmarks-${bookId}`;
}

export function loadBookmarks(bookId: string): ReaderBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(bookId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReaderBookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookId: string, bookmarks: ReaderBookmark[]): void {
  localStorage.setItem(storageKey(bookId), JSON.stringify(bookmarks));
}

export function addBookmark(
  bookId: string,
  bookmark: Omit<ReaderBookmark, "id">
): ReaderBookmark[] {
  const next: ReaderBookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
  };
  const updated = [next, ...loadBookmarks(bookId)];
  saveBookmarks(bookId, updated);
  return updated;
}

export function removeBookmark(bookId: string, id: string): ReaderBookmark[] {
  const updated = loadBookmarks(bookId).filter((b) => b.id !== id);
  saveBookmarks(bookId, updated);
  return updated;
}
