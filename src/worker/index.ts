/// <reference lib="webworker" />

/**
 * Service Worker — offline EPUB cache enforcement & reading-log sync.
 * Compiled by @ducanh2912/next-pwa from src/worker/index.ts
 */

declare const self: ServiceWorkerGlobalScope;

interface SyncEvent extends ExtendableEvent {
  tag: string;
}

const DB_NAME = "ebooks-lk-offline";
const DB_VERSION = 1;

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      /* schema owned by idb.ts on main thread */
    };
  });
}

async function getAllBookMeta(): Promise<
  Array<{ bookId: string; expiresAt: string }>
> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readonly");
    const store = tx.objectStore("books");
    const req = store.getAll();
    req.onsuccess = () => {
      const rows = (req.result ?? []) as Array<{
        bookId: string;
        expiresAt: string;
      }>;
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

async function purgeBookSW(bookId: string): Promise<void> {
  const db = await openOfflineDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["books", "chunks"], "readwrite");
    tx.objectStore("books").delete(bookId);

    const index = tx.objectStore("chunks").index("by-book");
    const cursorReq = index.openCursor(bookId);
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function enforceExpiryInSW(): Promise<string[]> {
  const now = Date.now();
  const books = await getAllBookMeta();
  const expired: string[] = [];

  for (const book of books) {
    if (new Date(book.expiresAt).getTime() <= now) {
      await purgeBookSW(book.bookId);
      expired.push(book.bookId);
    }
  }

  return expired;
}

async function syncReadingQueueSW(): Promise<void> {
  const db = await openOfflineDB();
  const pending: Array<{
    id: string;
    bookId: string;
    durationSeconds: number;
    recordedAt: string;
    synced: boolean;
  }> = await new Promise((resolve, reject) => {
    const tx = db.transaction("readingQueue", "readonly");
    const req = tx.objectStore("readingQueue").getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });

  const unsynced = pending.filter((p) => !p.synced);
  if (unsynced.length === 0) return;

  try {
    const res = await fetch("/api/reading-log/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessions: unsynced.map((p) => ({
          bookId: p.bookId,
          durationSeconds: p.durationSeconds,
          clientTimestamp: p.recordedAt,
        })),
      }),
    });

    if (!res.ok) return;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("readingQueue", "readwrite");
      for (const entry of unsynced) {
        tx.objectStore("readingQueue").put({ ...entry, synced: true });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* offline — Background Sync will retry */
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await enforceExpiryInSW();
      await self.clients.claim();
    })()
  );
});

/** Evaluate local clock on every controlled page load */
self.addEventListener("message", (event) => {
  const data = event.data as { type?: string; bookId?: string } | undefined;
  if (!data?.type) return;

  if (data.type === "ENFORCE_BORROW_EXPIRY") {
    event.waitUntil(
      (async () => {
        const expired = await enforceExpiryInSW();
        const client = event.source;
        if (client && "postMessage" in client) {
          client.postMessage({ type: "EXPIRY_ENFORCED", expired });
        }
      })()
    );
  }

  if (data.type === "CHECK_BOOK_EXPIRY" && data.bookId) {
    event.waitUntil(
      (async () => {
        const books = await getAllBookMeta();
        const book = books.find((b) => b.bookId === data.bookId);
        const expired =
          !book || new Date(book.expiresAt).getTime() <= Date.now();

        if (expired && data.bookId) {
          await purgeBookSW(data.bookId);
        }

        const client = event.source;
        if (client && "postMessage" in client) {
          client.postMessage({
            type: "BOOK_EXPIRY_RESULT",
            bookId: data.bookId,
            expired,
            expiresAt: book?.expiresAt,
          });
        }
      })()
    );
  }

  if (data.type === "SYNC_READING_LOGS") {
    event.waitUntil(syncReadingQueueSW());
  }
});

/** Background Sync for reading logs when connectivity returns */
self.addEventListener("sync", (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === "reading-log-sync") {
    syncEvent.waitUntil(syncReadingQueueSW());
  }
});

/** Never cache EPUB stream responses — always network-only */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.includes("/api/books/") && url.pathname.endsWith("/stream")) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  }
});

export {};
