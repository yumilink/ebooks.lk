/** App routes to keep available for offline refresh (document navigations). */
export const PWA_SHELL_ROUTES = [
  "/",
  "/books",
  "/my-book-pouch",
  "/offline",
  "/login",
  "/borrow-policy",
] as const;

/**
 * Request shell pages while online so Workbox can store HTML + RSC payloads.
 * Safe to call repeatedly; failures are ignored.
 */
export async function warmPwaShellCache(extraPaths: string[] = []): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const paths = [...new Set([...PWA_SHELL_ROUTES, ...extraPaths])];

  await Promise.allSettled(
    paths.map((path) =>
      fetch(path, {
        credentials: "same-origin",
        headers: { Accept: "text/html" },
      })
    )
  );
}

/** Reader URLs for books currently in the local pouch (ready copies only). */
export async function getPouchReaderPaths(): Promise<string[]> {
  const { listPouchBooks } = await import("@/lib/offline/pouch");
  const books = await listPouchBooks();
  return books
    .filter((book) => book.status === "ready")
    .map((book) => `/reader/${book.bookId}`);
}

export async function warmPwaShellWithPouchReaders(): Promise<void> {
  const readerPaths = await getPouchReaderPaths();
  await warmPwaShellCache(readerPaths);

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "WARM_SHELL",
      paths: readerPaths,
    });
  }
}
