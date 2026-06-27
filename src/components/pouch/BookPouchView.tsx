"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  formatPouchExpiry,
  listPouchBooks,
  type PouchBookEntry,
} from "@/lib/offline/pouch";
import { SITE_NAME } from "@/lib/brand";

function PouchBookCard({ book, offline }: { book: PouchBookEntry; offline: boolean }) {
  const ready = book.status === "ready";
  const progress =
    book.totalChunks > 0
      ? Math.round((book.chunkCount / book.totalChunks) * 100)
      : 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:border-amber-200 hover:shadow-md">
      <div className="relative aspect-[2/3] bg-gradient-to-br from-stone-100 to-amber-50">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <span className="text-center text-sm font-semibold leading-snug text-stone-600 line-clamp-4">
              {book.title}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-semibold leading-snug text-stone-900 line-clamp-2">
          {book.title}
        </h2>

        <p className="mt-2 text-xs text-stone-500">
          {ready ? (
            <span className="text-emerald-700">Ready offline</span>
          ) : (
            <span className="text-amber-700">Download {progress}%</span>
          )}
          {" · "}
          {formatPouchExpiry(book.expiresInMs)}
        </p>

        {!ready && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-amber-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {ready ? (
            <Link href={`/reader/${book.bookId}`} className="flex-1">
              <Button type="button" className="w-full py-2">
                Read
              </Button>
            </Link>
          ) : (
            <Link href={`/reader/${book.bookId}`} className="flex-1">
              <Button type="button" variant="secondary" className="w-full py-2">
                Continue download
              </Button>
            </Link>
          )}
          {!offline && (
            <Link href={`/books/${book.bookId}`}>
              <Button type="button" variant="ghost" className="py-2">
                Details
              </Button>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function BookPouchView() {
  const [books, setBooks] = useState<PouchBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const entries = await listPouchBooks();
      setBooks(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your pouch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const onStatus = () => setOffline(!navigator.onLine);
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    return () => {
      window.removeEventListener("online", onStatus);
      window.removeEventListener("offline", onStatus);
    };
  }, []);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          {SITE_NAME}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          My Book Pouch
        </h1>
        <p className="mt-3 text-stone-600">
          Borrowed books saved on this device. Open your pouch without Wi‑Fi — titles stay
          here until the 7-day borrow ends.
        </p>
      </div>

      {offline && (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You&apos;re offline. Showing books stored in your pouch on this device.
        </p>
      )}

      {loading && (
        <p className="py-16 text-center text-stone-500">Loading your pouch…</p>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && books.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-stone-900">Your pouch is empty</p>
          <p className="mt-2 text-sm text-stone-600">
            Borrow a book from the catalog. After the first download, it appears here for
            offline reading.
          </p>
          <Link href="/books" className="mt-6 inline-block">
            <Button type="button">Browse catalog</Button>
          </Link>
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {books.map((book) => (
            <PouchBookCard key={book.bookId} book={book} offline={offline} />
          ))}
        </div>
      )}
    </div>
  );
}
