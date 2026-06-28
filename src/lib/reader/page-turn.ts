export type PageTurnDirection = "next" | "prev";

/** Fallback if epub.js does not emit relocated after a scroll-only page turn. */
const RELOCATED_SAFETY_MS = 750;

/**
 * Serializes next/prev so only one page turn runs at a time.
 * epub.js scrollBy() returns before scrollLeft updates; rapid next() calls can
 * skip the last page of a chapter and jump to the next section early.
 */
export class PageTurnQueue {
  private busy = false;
  private readonly queue: PageTurnDirection[] = [];
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private perform: ((direction: PageTurnDirection) => void) | null = null;

  bind(perform: (direction: PageTurnDirection) => void): void {
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
    this.perform(direction);

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
