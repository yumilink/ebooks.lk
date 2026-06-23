"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { EpubReader } from "@/components/reader/EpubReader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  downloadBookForOffline,
  isOfflineCopyReady,
  type BorrowHandshake,
} from "@/lib/offline/borrow-manager";
import { countOfflineChunks, getStoredBook } from "@/lib/offline/idb";

type PageProps = { params: Promise<{ bookId: string }> };

export default function ReaderPage({ params }: PageProps) {
  const router = useRouter();
  const { status } = useSession();
  const [bookId, setBookId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setBookId(p.bookId));
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=/reader/${bookId ?? ""}`);
    }
  }, [status, router, bookId]);

  useEffect(() => {
    if (!bookId || status !== "authenticated") return;

    const controller = new AbortController();
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      setDownloadProgress(0);

      try {
        const borrowRes = await fetch(`/api/books/${bookId}/reborrow`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!borrowRes.ok) {
          const data = await borrowRes.json();
          throw new Error(data.error ?? "No active borrow. Borrow this book first from the catalog.");
        }

        const handshake = (await borrowRes.json()) as BorrowHandshake;
        if (cancelled) return;

        const detailRes = await fetch(`/api/books/${bookId}`, {
          signal: controller.signal,
        });
        const detail = await detailRes.json();
        if (!detailRes.ok) throw new Error(detail.error ?? "Book not found");
        if (cancelled) return;

        setBookTitle(detail.book.title);
        setExpiresAt(handshake.borrow.expiresAt);

        const stored = await getStoredBook(bookId!);
        const chunkCount = stored ? await countOfflineChunks(bookId!) : 0;

        if (stored && isOfflineCopyReady(stored, handshake, chunkCount)) {
          setLoading(false);
          return;
        }

        await downloadBookForOffline(bookId!, handshake, detail.book.title, {
          signal: controller.signal,
          onProgress: (pct) => {
            if (!cancelled) setDownloadProgress(pct);
          },
        });
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load reader");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDownloadProgress(0);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [bookId, status]);

  if (status === "loading" || !bookId) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-500">
        Loading reader…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Alert variant="error">{error}</Alert>
        <Link href={`/books/${bookId}`} className="mt-4 inline-block">
          <Button variant="secondary">Back to book</Button>
        </Link>
      </div>
    );
  }

  if (loading || !expiresAt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-stone-500">
        <p>Preparing encrypted offline copy…</p>
        <div className="w-64">
          <div className="h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-amber-600 transition-all"
              style={{ width: `${Math.max(downloadProgress, 2)}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs">
            {downloadProgress > 0 ? `${downloadProgress}%` : "Starting download…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 h-[100dvh]">
      <EpubReader
        bookId={bookId}
        bookTitle={bookTitle}
        expiresAt={expiresAt}
        onExpired={() => router.push(`/books/${bookId}`)}
      />
    </div>
  );
}
