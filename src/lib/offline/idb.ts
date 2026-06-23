import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export const DB_NAME = "ebooks-lk-offline";
export const DB_VERSION = 2;

export interface StoredBookMeta {
  bookId: string;
  borrowId: string;
  title: string;
  expiresAt: string;
  borrowedAt: string;
  totalChunks: number;
  totalSize: number;
  chunkSize: number;
  bookSalt: string;
  chunkKeyMaterial: string;
  ivSeed: string;
  downloadedAt: string;
}

export interface StoredChunk {
  bookId: string;
  chunkIndex: number;
  /** AES-GCM ciphertext */
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

export interface PendingReadingSession {
  id: string;
  bookId: string;
  durationSeconds: number;
  recordedAt: string;
  synced: boolean;
}

interface EbooksDB extends DBSchema {
  books: {
    key: string;
    value: StoredBookMeta;
    indexes: { "by-expires": string };
  };
  chunks: {
    key: [string, number];
    value: StoredChunk;
    indexes: { "by-book": string };
  };
  readingQueue: {
    key: string;
    value: PendingReadingSession;
    indexes: { "by-synced": number };
  };
}

let dbPromise: Promise<IDBPDatabase<EbooksDB>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<EbooksDB>> {
  if (!dbPromise) {
    dbPromise = openDB<EbooksDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("books")) {
          const books = db.createObjectStore("books", { keyPath: "bookId" });
          books.createIndex("by-expires", "expiresAt");
        }

        if (!db.objectStoreNames.contains("chunks")) {
          const chunks = db.createObjectStore("chunks", {
            keyPath: ["bookId", "chunkIndex"],
          });
          chunks.createIndex("by-book", "bookId");
        }

        if (!db.objectStoreNames.contains("readingQueue")) {
          const queue = db.createObjectStore("readingQueue", { keyPath: "id" });
          queue.createIndex("by-synced", "synced");
        }
      },
    });
  }
  return dbPromise;
}

export async function purgeBookFromIDB(bookId: string): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction(["books", "chunks"], "readwrite");

  const chunkIndex = tx.objectStore("chunks").index("by-book");
  let cursor = await chunkIndex.openCursor(bookId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.objectStore("books").delete(bookId);
  await tx.done;
}

export async function purgeExpiredBooks(now: Date = new Date()): Promise<string[]> {
  const db = await getOfflineDB();
  const expired: string[] = [];
  const tx = db.transaction("books", "readonly");
  const all = await tx.store.getAll();

  for (const book of all) {
    if (new Date(book.expiresAt).getTime() <= now.getTime()) {
      expired.push(book.bookId);
    }
  }

  for (const bookId of expired) {
    await purgeBookFromIDB(bookId);
  }

  return expired;
}

export async function getStoredBook(
  bookId: string
): Promise<StoredBookMeta | undefined> {
  const db = await getOfflineDB();
  return db.get("books", bookId);
}

export async function saveBookMeta(meta: StoredBookMeta): Promise<void> {
  const db = await getOfflineDB();
  await db.put("books", meta);
}

export async function saveEncryptedChunk(chunk: StoredChunk): Promise<void> {
  const db = await getOfflineDB();
  await db.put("chunks", chunk);
}

export async function saveEncryptedChunksBatch(chunks: StoredChunk[]): Promise<void> {
  if (chunks.length === 0) return;
  const db = await getOfflineDB();
  const tx = db.transaction("chunks", "readwrite");
  for (const chunk of chunks) {
    void tx.store.put(chunk);
  }
  await tx.done;
}

export async function countOfflineChunks(bookId: string): Promise<number> {
  const db = await getOfflineDB();
  return db.countFromIndex("chunks", "by-book", bookId);
}

export async function getEncryptedChunks(
  bookId: string
): Promise<StoredChunk[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("chunks", "by-book", bookId);
}

export async function queueReadingSession(
  session: Omit<PendingReadingSession, "id" | "synced">
): Promise<void> {
  const db = await getOfflineDB();
  await db.put("readingQueue", {
    ...session,
    id: crypto.randomUUID(),
    synced: false,
  });
}

export async function getPendingReadingSessions(): Promise<PendingReadingSession[]> {
  const db = await getOfflineDB();
  const all = await db.getAll("readingQueue");
  return all.filter((s) => !s.synced);
}

export async function markSessionsSynced(ids: string[]): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction("readingQueue", "readwrite");
  for (const id of ids) {
    const record = await tx.store.get(id);
    if (record) {
      await tx.store.put({ ...record, synced: true });
    }
  }
  await tx.done;
}

export async function clearDecryptionCache(): Promise<void> {
  if (typeof window !== "undefined") {
    (window as unknown as { __ebookDecryptCache?: Map<string, ArrayBuffer> }).__ebookDecryptCache?.clear();
  }
}
