"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ePub, { type Rendition } from "epubjs";
import {
  decryptBookInMemory,
  serverCheckIn,
  enforceOfflineExpiry,
} from "@/lib/offline/borrow-manager";
import { queueReadingSession } from "@/lib/offline/idb";
import {
  addBookmark,
  loadBookmarks,
  removeBookmark,
} from "@/lib/reader/bookmarks";
import { applyReaderTheme, attachReaderContentHooks, flattenToc, THEME_CHROME } from "@/lib/reader/epub-themes";
import {
  loadReaderPreferences,
  saveReaderPreferences,
} from "@/lib/reader/preferences";
import {
  fetchServerReadingPosition,
  loadReadingPosition,
  scheduleReadingPositionSync,
  syncReadingPositionToServer,
} from "@/lib/reader/position";
import { progressFromLocation, progressToFraction } from "@/lib/reader/progress";
import { measureReaderContainer, resizeRendition } from "@/lib/reader/resize";
import type { ReaderBookmark, ReaderPreferences, TocEntry } from "@/lib/reader/types";
import { READER_TOP_CHROME, READER_SPREAD_MIN_WIDTH } from "@/lib/reader/types";
import {
  ReaderToolbar,
  type ReaderPanel,
} from "@/components/reader/ReaderToolbar";

interface EpubReaderProps {
  bookId: string;
  bookTitle: string;
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

export function EpubReader({ bookId, bookTitle, expiresAt, onExpired }: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<Awaited<ReturnType<typeof ePub>> | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const initialFlowRef = useRef<string | null>(null);
  const prefsRef = useRef<ReaderPreferences>(loadReaderPreferences());

  const [remaining, setRemaining] = useState(
    () => new Date(expiresAt).getTime() - Date.now()
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<ReaderPreferences>(() => loadReaderPreferences());
  const [panel, setPanel] = useState<ReaderPanel>(null);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentHref, setCurrentHref] = useState<string>();

  const chrome = THEME_CHROME[prefs.theme];

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
    setBookmarks(loadBookmarks(bookId));
  }, [bookId]);

  useEffect(() => {
    prefsRef.current = prefs;
    saveReaderPreferences(prefs);
    const rendition = renditionRef.current;
    if (!rendition) return;
    applyReaderTheme(rendition.themes, prefs);
  }, [prefs]);

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

        const loadedPrefs = loadReaderPreferences();
        initialFlowRef.current = loadedPrefs.flow;
        prefsRef.current = loadedPrefs;
        setPrefs(loadedPrefs);

        const book = ePub(await blob.arrayBuffer());
        bookRef.current = book;
        await book.ready;

        void book.locations.generate(1600).then(() => {
          const rendition = renditionRef.current;
          if (!rendition) return;
          const loc = rendition.currentLocation();
          if (loc?.start) setProgress(progressFromLocation({ start: loc.start }));
        });

        const navigation = await book.loaded.navigation;
        if (!cancelled) {
          setToc(flattenToc(navigation.toc));
        }

        if (!containerRef.current) return;

        const { width, height } = measureReaderContainer(containerRef.current);

        const useSpread =
          width >= READER_SPREAD_MIN_WIDTH && loadedPrefs.flow === "paginated";

        const rendition = book.renderTo(containerRef.current, {
          width: width > 0 ? width : "100%",
          height: height > 0 ? height : "100%",
          spread: useSpread ? "always" : "none",
          minSpreadWidth: READER_SPREAD_MIN_WIDTH,
          flow: loadedPrefs.flow === "scrolled" ? "scrolled-doc" : "paginated",
        });

        applyReaderTheme(rendition.themes, loadedPrefs);
        attachReaderContentHooks(rendition, () => prefsRef.current.theme);

        rendition.on(
          "relocated",
          (location: {
            start: {
              cfi: string;
              href: string;
              percentage: number;
              displayed?: { page: number; total: number };
            };
          }) => {
            let pct = progressFromLocation(location);
            if (pct === 0 && bookRef.current?.locations) {
              try {
                const locs = bookRef.current.locations as {
                  percentageFromCfi?: (cfi: string) => number;
                };
                const fromCfi = locs.percentageFromCfi?.(location.start.cfi);
                if (fromCfi && fromCfi > 0) pct = fromCfi * 100;
              } catch {
                /* use page/total only */
              }
            }
            setCurrentHref(location.start.href);
            setProgress(pct);
            scheduleReadingPositionSync({
              bookId,
              cfi: location.start.cfi,
              href: location.start.href,
              percentage: progressToFraction(pct),
              updatedAt: new Date().toISOString(),
            });
          }
        );

        renditionRef.current = rendition;

        const localPosition = loadReadingPosition(bookId);
        const serverPosition =
          localPosition ?? (await fetchServerReadingPosition(bookId));

        if (serverPosition?.cfi) {
          await rendition.display(serverPosition.cfi);
          setProgress(serverPosition.percentage * 100);
        } else {
          await rendition.display();
        }

        sessionStartRef.current = Date.now();
        setLoading(false);

        requestAnimationFrame(() => {
          resizeRendition(renditionRef.current, containerRef.current, {
            paginated: loadedPrefs.flow === "paginated",
          });
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load book");
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      renditionRef.current = null;
    };
  }, [bookId]);

  useEffect(() => {
    if (loading || error) return;

    const el = containerRef.current;
    if (!el) return;

    const onResize = () =>
      resizeRendition(renditionRef.current, el, {
        paginated: prefsRef.current.flow === "paginated",
      });

    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    onResize();

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [loading, error]);

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
        const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
          sync: { register: (tag: string) => Promise<void> };
        };
        await reg.sync.register("reading-log-sync").catch(() => {
          /* fallback below */
        });
      }

      navigator.serviceWorker.controller?.postMessage({ type: "SYNC_READING_LOGS" });
      void import("@/lib/offline/borrow-manager").then((m) => m.syncPendingReadingLogs());

      const rendition = renditionRef.current;
      if (rendition) {
        const location = await Promise.resolve(rendition.currentLocation());
        if (location?.start?.cfi) {
          const position = {
            bookId,
            cfi: location.start.cfi,
            href: location.start.href,
            percentage: location.start.percentage,
            updatedAt: new Date().toISOString(),
          };
          void syncReadingPositionToServer(position);
        }
      }

      sessionStartRef.current = Date.now();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") void recordSession();
    };

    const readingTimer = setInterval(() => {
      void recordSession();
    }, 60_000);

    window.addEventListener("focus", () => {
      void import("@/lib/offline/borrow-manager").then((m) => m.syncPendingReadingLogs());
    });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", () => void recordSession());

    return () => {
      clearInterval(readingTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", () => void recordSession());
      void recordSession();
    };
  }, [bookId]);

  const blockRip = useCallback((e: { preventDefault: () => void }) => {
    e.preventDefault();
  }, []);

  const goNext = useCallback(() => {
    void renditionRef.current?.next();
  }, []);

  const goPrev = useCallback(() => {
    void renditionRef.current?.prev();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const goToHref = useCallback((href: string) => {
    void renditionRef.current?.display(href);
  }, []);

  const goToCfi = useCallback((cfi: string) => {
    void renditionRef.current?.display(cfi);
  }, []);

  const handleBookmarkAdd = useCallback(async () => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const location = await Promise.resolve(rendition.currentLocation());
    const cfi = location?.start?.cfi;
    if (!cfi) return;

    const pct = Math.round((location.start.percentage ?? 0) * 100);
    const chapter =
      toc.find(
        (entry) =>
          currentHref &&
          (currentHref === entry.href ||
            currentHref.endsWith(entry.href) ||
            entry.href.endsWith(currentHref))
      )?.label ?? "Bookmark";

    const updated = addBookmark(bookId, {
      cfi,
      label: `${chapter} (${pct}%)`,
      createdAt: new Date().toISOString(),
    });
    setBookmarks(updated);
  }, [bookId, currentHref, toc]);

  const handlePrefsChange = useCallback((next: ReaderPreferences) => {
    if (next.flow !== initialFlowRef.current) {
      const ok = window.confirm(
        "Changing layout requires reopening the book. Save and reload now?"
      );
      if (!ok) return;
      saveReaderPreferences(next);
      window.location.reload();
      return;
    }
    setPrefs(next);
  }, []);

  return (
    <div
      className="relative flex h-full min-h-0 flex-col"
      style={{ background: chrome.shell, color: chrome.text }}
    >
      {!loading && !error && (
        <ReaderToolbar
          bookId={bookId}
          bookTitle={bookTitle}
          panel={panel}
          onPanelChange={setPanel}
          prefs={prefs}
          onPrefsChange={handlePrefsChange}
          toc={toc}
          bookmarks={bookmarks}
          currentHref={currentHref}
          progress={progress}
          onTocSelect={goToHref}
          onBookmarkAdd={() => void handleBookmarkAdd()}
          onBookmarkGo={goToCfi}
          onBookmarkRemove={(id) => setBookmarks(removeBookmark(bookId, id))}
          onPrev={goPrev}
          onNext={goNext}
          remainingLabel={formatRemaining(remaining)}
        />
      )}

      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center text-sm"
          style={{ color: chrome.muted, background: chrome.shell }}
        >
          Decrypting and loading…
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-red-500">
          {error}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="ereader-container absolute bottom-0 select-none max-md:left-9 max-md:right-9 md:inset-x-0"
          onContextMenu={blockRip}
          onCopy={blockRip}
          onCut={blockRip}
          onDragStart={blockRip}
          style={{
            top: `calc(${READER_TOP_CHROME} + env(safe-area-inset-top, 0px))`,
            userSelect: "none",
            WebkitUserSelect: "none",
            background: chrome.shell,
            ["--reader-bg" as string]: chrome.shell,
          }}
        />
      </div>
    </div>
  );
}
