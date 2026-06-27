"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  downloadBookForOffline,
  type BorrowHandshake,
} from "@/lib/offline/borrow-manager";
import { isSecureCryptoContext, INSECURE_CONTEXT_MESSAGE } from "@/lib/crypto/secure-context";
import { warmPwaShellCache } from "@/lib/offline/pwa-shell";

interface BookActionsProps {
  bookId: string;
  bookTitle: string;
  coverImageUrl: string;
  canBorrow: boolean;
  isLoggedIn: boolean;
  hasActiveBorrow: boolean;
  expiresAt: string | null;
  subscriptionActive: boolean;
}

export function BookActions({
  bookId,
  bookTitle,
  coverImageUrl,
  canBorrow,
  isLoggedIn,
  hasActiveBorrow,
  expiresAt,
  subscriptionActive,
}: BookActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"borrow" | "reborrow" | "read" | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchHandshake(endpoint: "borrow" | "reborrow"): Promise<BorrowHandshake> {
    const res = await fetch(`/api/books/${bookId}/${endpoint}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data as BorrowHandshake;
  }

  async function handleBorrow() {
    if (!isSecureCryptoContext()) {
      setError(INSECURE_CONTEXT_MESSAGE);
      return;
    }
    setError(null);
    setMessage(null);
    setLoading("borrow");
    setProgress(0);

    try {
      const handshake = await fetchHandshake("borrow");
      await downloadBookForOffline(bookId, handshake, bookTitle, {
        onProgress: setProgress,
        coverImageUrl,
      });
      void warmPwaShellCache([`/reader/${bookId}`]);
      setMessage("Book downloaded for offline reading.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Borrow failed");
    } finally {
      setLoading(null);
      setProgress(0);
    }
  }

  async function handleReborrow() {
    if (!isSecureCryptoContext()) {
      setError(INSECURE_CONTEXT_MESSAGE);
      return;
    }
    setError(null);
    setMessage(null);
    setLoading("reborrow");
    setProgress(0);

    try {
      const handshake = await fetchHandshake("reborrow");
      await downloadBookForOffline(bookId, handshake, bookTitle, {
        onProgress: setProgress,
        coverImageUrl,
      });
      void warmPwaShellCache([`/reader/${bookId}`]);
      setMessage("Borrow renewed for 7 days and re-downloaded.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-borrow failed");
    } finally {
      setLoading(null);
      setProgress(0);
    }
  }

  function handleRead() {
    router.push(`/reader/${bookId}`);
  }

  if (!isLoggedIn) {
    return (
      <Alert variant="info">
        <Link href={`/login?callbackUrl=/books/${bookId}`} className="font-medium text-amber-800 underline">
          Sign in
        </Link>{" "}
        with an active membership to borrow this book.
      </Alert>
    );
  }

  if (!subscriptionActive) {
    return (
      <Alert variant="warning">
        Your subscription is inactive. Contact support to borrow books.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      {hasActiveBorrow && expiresAt && (
        <Alert variant="info">
          Active borrow expires{" "}
          <strong>{new Date(expiresAt).toLocaleString()}</strong>
        </Alert>
      )}

      {loading && progress > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-stone-500">
            <span>Downloading encrypted copy…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-amber-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {canBorrow && !hasActiveBorrow && (
          <Button onClick={handleBorrow} loading={loading === "borrow"}>
            Borrow (7 days)
          </Button>
        )}

        {hasActiveBorrow && (
          <>
            <Button onClick={handleRead} variant="primary" loading={loading === "read"}>
              Read now
            </Button>
            <Button
              onClick={handleReborrow}
              variant="secondary"
              loading={loading === "reborrow"}
            >
              Re-borrow
            </Button>
          </>
        )}

        {canBorrow && hasActiveBorrow && loading === null && (
          <Button onClick={handleBorrow} variant="secondary">
            Re-download offline copy
          </Button>
        )}
      </div>
    </div>
  );
}
