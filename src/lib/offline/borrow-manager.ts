import {
  deriveAesKey,
  encryptChunk,
  ivForChunkIndex,
  decryptChunk,
} from "@/lib/crypto/client";
import {
  saveBookMeta,
  saveEncryptedChunk,
  purgeBookFromIDB,
  purgeExpiredBooks,
  getStoredBook,
  getEncryptedChunks,
  type StoredBookMeta,
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

export async function serverCheckIn(bookId: string): Promise<{
  allowed: boolean;
  purgeLocal: boolean;
  expiresAt?: string;
  borrowId?: string;
}> {
  const stored = await getStoredBook(bookId);
  const res = await fetch("/api/borrow/check-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookId,
      clientExpiresAt: stored?.expiresAt,
    }),
  });

  const data = await res.json();

  if (data.purgeLocal) {
    await purgeBookFromIDB(bookId);
  }

  return data;
}

export async function enforceOfflineExpiry(): Promise<string[]> {
  return purgeExpiredBooks(new Date());
}

export async function downloadBookForOffline(
  bookId: string,
  handshake: BorrowHandshake,
  title: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const headRes = await fetch(`/api/books/${bookId}/stream`, { method: "HEAD" });
  if (!headRes.ok) {
    throw new Error("Stream authorization failed");
  }

  const totalChunks = parseInt(headRes.headers.get("X-Total-Chunks") ?? "0", 10);
  const totalSize = parseInt(headRes.headers.get("X-Total-Size") ?? "0", 10);
  const chunkSize = handshake.chunkSize;

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
    totalSize,
    chunkSize,
    bookSalt: handshake.bookSalt,
    chunkKeyMaterial: handshake.crypto.chunkKeyMaterial,
    ivSeed: handshake.crypto.ivSeed,
    downloadedAt: new Date().toISOString(),
  };

  await saveBookMeta(meta);

  for (let i = 0; i < totalChunks; i++) {
    const res = await fetch(`/api/books/${bookId}/stream?chunk=${i}`);
    if (!res.ok) throw new Error(`Failed to download chunk ${i}`);

    const plaintext = await res.arrayBuffer();
    const iv = ivForChunkIndex(handshake.crypto.ivSeed, i);
    const ciphertext = await encryptChunk(aesKey, iv, plaintext);

    await saveEncryptedChunk({
      bookId,
      chunkIndex: i,
      ciphertext,
      iv,
    });

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
    const decrypted = await decryptChunk(aesKey, chunk.iv, chunk.ciphertext);
    parts.push(decrypted);
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
