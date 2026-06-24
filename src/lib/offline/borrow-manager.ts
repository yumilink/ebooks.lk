import {
  deriveAesKey,
  encryptChunk,
  ivForChunkIndex,
  decryptChunk,
} from "@/lib/crypto/client";
import {
  saveBookMeta,
  saveEncryptedChunksBatch,
  purgeBookFromIDB,
  purgeExpiredBooks,
  getStoredBook,
  getEncryptedChunks,
  countOfflineChunks,
  type StoredBookMeta,
  type StoredChunk,
} from "@/lib/offline/idb";

export interface BorrowHandshake {
  borrow: {
    id: string;
    bookId: string;
    expiresAt: string;
    borrowedAt: string;
  };
  crypto: {
    chunkKeyMaterial: string;
    ivSeed: string;
  };
  bookSalt: string;
  chunkSize: number;
  totalSize: number;
  title?: string;
}

export interface DownloadOptions {
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
}

const activeDownloads = new Map<string, Promise<void>>();

export function isOfflineCopyReady(
  stored: StoredBookMeta,
  handshake: BorrowHandshake,
  chunkCount: number
): boolean {
  return (
    chunkCount >= stored.totalChunks &&
    stored.borrowId === handshake.borrow.id &&
    stored.chunkSize === handshake.chunkSize &&
    stored.chunkKeyMaterial === handshake.crypto.chunkKeyMaterial
  );
}

/** Local copy complete and borrow not expired — no server handshake required. */
export function isLocalCopyReadable(
  stored: StoredBookMeta,
  chunkCount: number,
  now: Date = new Date()
): boolean {
  return (
    chunkCount >= stored.totalChunks &&
    new Date(stored.expiresAt).getTime() > now.getTime()
  );
}

export async function getReadableLocalBorrow(
  bookId: string
): Promise<StoredBookMeta | null> {
  await enforceOfflineExpiry();
  const stored = await getStoredBook(bookId);
  if (!stored) return null;
  const chunkCount = await countOfflineChunks(bookId);
  if (!isLocalCopyReadable(stored, chunkCount)) return null;
  return stored;
}

export async function serverCheckIn(bookId: string): Promise<{
  allowed: boolean;
  purgeLocal: boolean;
  expiresAt?: string;
  borrowId?: string;
}> {
  const stored = await getStoredBook(bookId);

  if (!navigator.onLine) {
    if (stored && new Date(stored.expiresAt).getTime() > Date.now()) {
      return { allowed: true, purgeLocal: false, expiresAt: stored.expiresAt };
    }
    return { allowed: false, purgeLocal: false };
  }

  let data: {
    allowed?: boolean;
    purgeLocal?: boolean;
    expiresAt?: string;
    borrowId?: string;
  };

  try {
    const res = await fetch("/api/borrow/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId,
        clientExpiresAt: stored?.expiresAt,
      }),
    });
    data = await res.json();
  } catch {
    if (stored && new Date(stored.expiresAt).getTime() > Date.now()) {
      return { allowed: true, purgeLocal: false, expiresAt: stored.expiresAt };
    }
    return { allowed: false, purgeLocal: false };
  }

  if (data.purgeLocal) {
    await purgeBookFromIDB(bookId);
  }

  return {
    allowed: Boolean(data.allowed),
    purgeLocal: Boolean(data.purgeLocal),
    expiresAt: data.expiresAt,
    borrowId: data.borrowId,
  };
}

export async function enforceOfflineExpiry(): Promise<string[]> {
  return purgeExpiredBooks(new Date());
}

export async function downloadBookForOffline(
  bookId: string,
  handshake: BorrowHandshake,
  title: string,
  options?: DownloadOptions | ((pct: number) => void)
): Promise<void> {
  const opts: DownloadOptions =
    typeof options === "function" ? { onProgress: options } : (options ?? {});

  const existing = activeDownloads.get(bookId);
  if (existing) {
    return existing;
  }

  const task = downloadBookForOfflineImpl(bookId, handshake, title, opts).finally(
    () => {
      activeDownloads.delete(bookId);
    }
  );

  activeDownloads.set(bookId, task);
  return task;
}

async function downloadBookForOfflineImpl(
  bookId: string,
  handshake: BorrowHandshake,
  title: string,
  { signal, onProgress }: DownloadOptions
): Promise<void> {
  onProgress?.(0);

  const totalChunks = Math.ceil(handshake.totalSize / handshake.chunkSize);
  if (totalChunks <= 0) {
    throw new Error("Invalid book size");
  }

  const stored = await getStoredBook(bookId);
  const chunkCount = await countOfflineChunks(bookId);
  if (stored && !isOfflineCopyReady(stored, handshake, chunkCount)) {
    await purgeBookFromIDB(bookId);
  }

  const aesKey = await deriveAesKey(
    handshake.crypto.chunkKeyMaterial,
    handshake.bookSalt,
    handshake.borrow.id
  );

  const meta: StoredBookMeta = {
    bookId,
    borrowId: handshake.borrow.id,
    title,
    expiresAt: handshake.borrow.expiresAt,
    borrowedAt: handshake.borrow.borrowedAt,
    totalChunks,
    totalSize: handshake.totalSize,
    chunkSize: handshake.chunkSize,
    bookSalt: handshake.bookSalt,
    chunkKeyMaterial: handshake.crypto.chunkKeyMaterial,
    ivSeed: handshake.crypto.ivSeed,
    downloadedAt: new Date().toISOString(),
  };

  await saveBookMeta(meta);

  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) {
      throw new DOMException("Download cancelled", "AbortError");
    }

    const res = await fetch(`/api/books/${bookId}/stream?chunk=${i}`, { signal });
    if (!res.ok) throw new Error(`Failed to download chunk ${i}`);

    const plaintext = await res.arrayBuffer();
    const iv = ivForChunkIndex(handshake.crypto.ivSeed, i);
    const ciphertext = await encryptChunk(aesKey, iv, plaintext);

    const chunk: StoredChunk = { bookId, chunkIndex: i, ciphertext, iv };
    await saveEncryptedChunksBatch([chunk]);

    onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
  }
}

/**
 * Decrypt all chunks in-memory and assemble EPUB blob.
 * Never persisted unencrypted.
 */
export async function decryptBookInMemory(bookId: string): Promise<Blob> {
  const meta = await getStoredBook(bookId);
  if (!meta) throw new Error("Book not found offline");

  if (new Date(meta.expiresAt).getTime() <= Date.now()) {
    await purgeBookFromIDB(bookId);
    throw new Error("Borrow expired");
  }

  const aesKey = await deriveAesKey(
    meta.chunkKeyMaterial,
    meta.bookSalt,
    meta.borrowId
  );

  const chunks = await getEncryptedChunks(bookId);
  chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

  const parts: ArrayBuffer[] = [];
  for (const chunk of chunks) {
    parts.push(await decryptChunk(aesKey, chunk.iv, chunk.ciphertext));
  }

  return new Blob(parts, { type: "application/epub+zip" });
}

export async function syncPendingReadingLogs(): Promise<void> {
  const { getPendingReadingSessions, markSessionsSynced } = await import(
    "@/lib/offline/idb"
  );

  const pending = await getPendingReadingSessions();
  if (pending.length === 0) return;

  const res = await fetch("/api/reading-log/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessions: pending.map((p) => ({
        bookId: p.bookId,
        durationSeconds: p.durationSeconds,
        clientTimestamp: p.recordedAt,
      })),
    }),
  });

  if (!res.ok) return;

  await markSessionsSynced(pending.map((p) => p.id));
}
