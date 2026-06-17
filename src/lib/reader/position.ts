export interface ReadingPosition {
  bookId: string;
  cfi: string;
  href: string;
  percentage: number;
  updatedAt: string;
}

function storageKey(bookId: string): string {
  return `ebooks-lk-reading-position-${bookId}`;
}

export function loadReadingPosition(bookId: string): ReadingPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(bookId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReadingPosition;
    if (!parsed.cfi) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveReadingPosition(position: ReadingPosition): void {
  localStorage.setItem(storageKey(position.bookId), JSON.stringify(position));
}

export async function fetchServerReadingPosition(
  bookId: string
): Promise<ReadingPosition | null> {
  try {
    const res = await fetch(`/api/books/${bookId}/reading-progress`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      positionCfi?: string | null;
      href?: string | null;
      progressPercentage?: number | null;
      lastReadAt?: string | null;
    };
    if (!data.positionCfi) return null;
    return {
      bookId,
      cfi: data.positionCfi,
      href: data.href ?? "",
      percentage: data.progressPercentage ?? 0,
      updatedAt: data.lastReadAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleReadingPositionSync(position: ReadingPosition): void {
  saveReadingPosition(position);
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void syncReadingPositionToServer(position);
  }, 3000);
}

export async function syncReadingPositionToServer(
  position: ReadingPosition
): Promise<void> {
  try {
    await fetch(`/api/books/${position.bookId}/reading-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        positionCfi: position.cfi,
        href: position.href,
        progressPercentage: position.percentage,
        readAt: position.updatedAt,
      }),
    });
  } catch {
    /* retry on next relocated event */
  }
}
