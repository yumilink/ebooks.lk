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
  type BorrowHandshake,
} from "@/lib/offline/borrow-manager";
import { getStoredBook } from "@/lib/offline/idb";

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

    async function init() {
      setLoading(true);
      setError(null);

      try {
        const detailRes = await fetch(`/api/books/${bookId}`);
        const detail = await detailRes.json();
        if (!detailRes.ok) throw new Error(detail.error ?? "Book not found");
        setBookTitle(detail.book.title);

        const stored = await getStoredBook(bookId!);
        if (stored) {
          setExpiresAt(stored.expiresAt);
          setLoading(false);
          return;
        }

        const borrowRes = await fetch(`/api/books/${bookId}/reborrow`, {
          method: "GET",
        });

        if (!borrowRes.ok) {
          throw new Error("No active borrow. Borrow this book first from the catalog.");
        }

        const handshake = (await borrowRes.json()) as BorrowHandshake;
        setExpiresAt(handshake.borrow.expiresAt);

        await downloadBookForOffline(
          bookId!,
          handshake,
          detail.book.title,
          setDownloadProgress
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reader");
      } finally {
        setLoading(false);
        setDownloadProgress(0);
      }
    }

    void init();
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
        {downloadProgress > 0 && (
          <div className="w-64">
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full bg-amber-600 transition-all"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs">{downloadProgress}%</p>
          </div>
        )}
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
