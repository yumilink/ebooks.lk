import { enforceOfflineExpiry } from "@/lib/offline/borrow-manager";
import {
  countOfflineChunks,
  listStoredBooks,
  saveBookMeta,
  type StoredBookMeta,
} from "@/lib/offline/idb";

export type PouchBookStatus = "ready" | "incomplete" | "expired";

export interface PouchBookEntry {
  bookId: string;
  title: string;
  coverImageUrl?: string;
  expiresAt: string;
  borrowedAt: string;
  downloadedAt: string;
  chunkCount: number;
  totalChunks: number;
  status: PouchBookStatus;
  expiresInMs: number;
}

function statusForBook(
  meta: StoredBookMeta,
  chunkCount: number,
  now: Date
): PouchBookStatus {
  if (new Date(meta.expiresAt).getTime() <= now.getTime()) return "expired";
  if (chunkCount < meta.totalChunks) return "incomplete";
  return "ready";
}

async function ensureCoverImage(meta: StoredBookMeta): Promise<StoredBookMeta> {
  if (meta.coverImageUrl || typeof navigator === "undefined" || !navigator.onLine) {
    return meta;
  }

  try {
    const res = await fetch(`/api/books/${meta.bookId}`);
    if (!res.ok) return meta;
    const data = (await res.json()) as { book?: { coverImageUrl?: string } };
    const coverImageUrl = data.book?.coverImageUrl;
    if (!coverImageUrl) return meta;

    const updated = { ...meta, coverImageUrl };
    await saveBookMeta(updated);
    return updated;
  } catch {
    return meta;
  }
}

/** Books saved on this device — no server API required (Phase B pouch). */
export async function listPouchBooks(): Promise<PouchBookEntry[]> {
  await enforceOfflineExpiry();

  const stored = await listStoredBooks();
  const now = new Date();

  const entries = await Promise.all(
    stored.map(async (raw) => {
      const meta = await ensureCoverImage(raw);
      const chunkCount = await countOfflineChunks(meta.bookId);
      const status = statusForBook(meta, chunkCount, now);
      const expiresInMs = new Date(meta.expiresAt).getTime() - now.getTime();

      return {
        bookId: meta.bookId,
        title: meta.title,
        coverImageUrl: meta.coverImageUrl,
        expiresAt: meta.expiresAt,
        borrowedAt: meta.borrowedAt,
        downloadedAt: meta.downloadedAt,
        chunkCount,
        totalChunks: meta.totalChunks,
        status,
        expiresInMs,
      } satisfies PouchBookEntry;
    })
  );

  return entries
    .filter((e) => e.status !== "expired")
    .sort((a, b) => {
      if (a.status !== b.status) {
        const order: Record<PouchBookStatus, number> = {
          ready: 0,
          incomplete: 1,
          expired: 2,
        };
        return order[a.status] - order[b.status];
      }
      return new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime();
    });
}

export function formatPouchExpiry(ms: number): string {
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
}
