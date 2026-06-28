import type { Rendition } from "epubjs";

export type PageTurnDirection = "next" | "prev";

/** Fallback if epub.js does not emit relocated after a scroll-only page turn. */
const RELOCATED_SAFETY_MS = 750;

/** Tolerance for sub-pixel scroll positions and column rounding. */
const SCROLL_EPSILON = 8;

interface EpubManager {
  isPaginated: boolean;
  settings: { axis: string; direction?: string; rtlScrollType?: string };
  container: HTMLElement;
  layout: { delta: number; height: number };
  scrollBy: (x: number, y: number, silent?: boolean) => void;
}

function getManager(rendition: Rendition): EpubManager | null {
  const manager = (rendition as { manager?: EpubManager }).manager;
  return manager ?? null;
}

/** epub.js skips relocated when scrollBy(..., silent=true); refresh after in-chapter scroll. */
async function notifyLocationAfterScroll(rendition: Rendition): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await rendition.reportLocation();
}

async function scrollInChapter(
  manager: EpubManager,
  rendition: Rendition,
  x: number,
  y: number
): Promise<void> {
  manager.scrollBy(x, y, false);
  await notifyLocationAfterScroll(rendition);
}

/**
 * epub.js DefaultViewManager.next() uses
 * `scrollLeft + offsetWidth + delta <= scrollWidth` to decide whether to scroll
 * within a chapter. That jumps to the next section one page early when less
 * than a full page width remains — the last page of a chapter is skipped.
 */
export async function safeTurnPage(
  rendition: Rendition,
  direction: PageTurnDirection
): Promise<void> {
  const manager = getManager(rendition);
  if (!manager?.isPaginated) {
    await (direction === "next" ? rendition.next() : rendition.prev());
    return;
  }

  const { axis, direction: writingDir = "ltr" } = manager.settings;

  if (axis === "horizontal" && writingDir === "rtl") {
    await (direction === "next" ? rendition.next() : rendition.prev());
    return;
  }

  const container = manager.container;

  if (axis === "horizontal") {
    const delta = manager.layout.delta;
    const maxScroll = Math.max(0, container.scrollWidth - container.offsetWidth);
    const scrollLeft = container.scrollLeft;

    if (direction === "next") {
      if (scrollLeft + SCROLL_EPSILON < maxScroll) {
        await scrollInChapter(
          manager,
          rendition,
          Math.min(delta, maxScroll - scrollLeft),
          0
        );
        return;
      }
      await rendition.next();
      return;
    }

    if (scrollLeft > SCROLL_EPSILON) {
      await scrollInChapter(manager, rendition, -Math.min(delta, scrollLeft), 0);
      return;
    }
    await rendition.prev();
    return;
  }

  if (axis === "vertical") {
    const pageHeight = manager.layout.height;
    const maxScroll = Math.max(0, container.scrollHeight - container.offsetHeight);
    const scrollTop = container.scrollTop;

    if (direction === "next") {
      if (scrollTop + SCROLL_EPSILON < maxScroll) {
        await scrollInChapter(
          manager,
          rendition,
          0,
          Math.min(pageHeight, maxScroll - scrollTop)
        );
        return;
      }
      await rendition.next();
      return;
    }

    if (scrollTop > SCROLL_EPSILON) {
      await scrollInChapter(manager, rendition, 0, -Math.min(pageHeight, scrollTop));
      return;
    }
    await rendition.prev();
  }
}

/**
 * Serializes next/prev so only one page turn runs at a time.
 * Waits for epub.js "relocated" before starting the next queued turn.
 */
export class PageTurnQueue {
  private busy = false;
  private readonly queue: PageTurnDirection[] = [];
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private perform: ((direction: PageTurnDirection) => void | Promise<void>) | null = null;

  bind(perform: (direction: PageTurnDirection) => void | Promise<void>): void {
    this.perform = perform;
  }

  request(direction: PageTurnDirection): void {
    this.queue.push(direction);
    this.drain();
  }

  onRelocated(): void {
    this.clearSafety();
    this.busy = false;
    this.drain();
  }

  reset(): void {
    this.queue.length = 0;
    this.busy = false;
    this.clearSafety();
  }

  private drain(): void {
    if (this.busy || !this.perform || this.queue.length === 0) return;

    this.busy = true;
    const direction = this.queue.shift()!;
    void Promise.resolve(this.perform(direction));

    this.safetyTimer = setTimeout(() => {
      this.safetyTimer = null;
      this.busy = false;
      this.drain();
    }, RELOCATED_SAFETY_MS);
  }

  private clearSafety(): void {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
  }
}
