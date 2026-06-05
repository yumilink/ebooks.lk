"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ePub, { type Book as EpubBook } from "epubjs";
import {
  decryptBookInMemory,
  serverCheckIn,
  enforceOfflineExpiry,
} from "@/lib/offline/borrow-manager";
import { queueReadingSession } from "@/lib/offline/idb";

interface EpubReaderProps {
  bookId: string;
  expiresAt: string;
  onExpired?: () => void;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${days}d ${hours}h ${mins}m remaining`;
}

export function EpubReader({ bookId, expiresAt, onExpired }: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<ReturnType<EpubBook["renderTo"]> | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const [remaining, setRemaining] = useState(
    () => new Date(expiresAt).getTime() - Date.now()
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleExpiry = useCallback(async () => {
    onExpired?.();
    setError("Your 7-day borrowing period has expired.");
    renditionRef.current?.destroy();
  }, [onExpired]);

  useEffect(() => {
    const tick = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemaining(ms);
      if (ms <= 0) {
        clearInterval(tick);
        void handleExpiry();
      }
    }, 30_000);
    return () => clearInterval(tick);
  }, [expiresAt, handleExpiry]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "CHECK_BOOK_EXPIRY",
            bookId,
          });
        }

        await enforceOfflineExpiry();
        const checkIn = await serverCheckIn(bookId);
        if (!checkIn.allowed) {
          setError("Borrow expired or invalid. Please re-borrow online.");
          setLoading(false);
          return;
        }

        const blob = await decryptBookInMemory(bookId);
        if (cancelled) return;

        const book = ePub(await blob.arrayBuffer());
        if (!containerRef.current) return;

        const rendition = book.renderTo(containerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: "paginated",
        });

        renditionRef.current = rendition;
        await rendition.display();
        sessionStartRef.current = Date.now();
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load book");
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
    };
  }, [bookId]);

  useEffect(() => {
    const recordSession = async () => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (elapsed < 5) return;

      await queueReadingSession({
        bookId,
        durationSeconds: elapsed,
        recordedAt: new Date().toISOString(),
      });

      if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register("reading-log-sync").catch(() => {
          /* fallback below */
        });
      }

      navigator.serviceWorker.controller?.postMessage({ type: "SYNC_READING_LOGS" });
      sessionStartRef.current = Date.now();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") void recordSession();
    };

    window.addEventListener("focus", () => {
      void import("@/lib/offline/borrow-manager").then((m) => m.syncPendingReadingLogs());
    });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", () => void recordSession());

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", () => void recordSession());
    };
  }, [bookId]);

  const blockRip = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const goNext = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const goPrev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  return (
    <div className="flex h-full flex-col bg-stone-900 text-stone-100">
      <header className="flex items-center justify-between border-b border-stone-700 px-4 py-3">
        <span className="text-sm font-medium text-amber-400">
          {formatRemaining(remaining)}
        </span>
        <span className="text-xs text-stone-400">Library borrow — offline enabled</span>
      </header>

      {loading && (
        <div className="flex flex-1 items-center justify-center text-stone-400">
          Decrypting and loading…
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-red-400">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="ereader-container min-h-0 flex-1 select-none"
        onContextMenu={blockRip}
        onCopy={blockRip}
        onCut={blockRip}
        onDragStart={blockRip}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      />

      {!loading && !error && (
        <footer className="flex items-center justify-between border-t border-stone-700 px-4 py-3">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-md px-4 py-2 text-sm text-stone-300 hover:bg-stone-800"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-md px-4 py-2 text-sm text-stone-300 hover:bg-stone-800"
          >
            Next →
          </button>
        </footer>
      )}
    </div>
  );
}
