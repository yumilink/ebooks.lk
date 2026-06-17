import type { Rendition } from "epubjs";
import { READER_SPREAD_MIN_WIDTH } from "@/lib/reader/types";

/** Measure the reader viewport element for epub.js pagination. */
export function measureReaderContainer(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/** Two-page spread on tablet/desktop; single page on mobile. */
export function applyReaderSpread(
  rendition: Rendition | null,
  containerWidth: number,
  paginated: boolean
): void {
  if (!rendition || !paginated) return;
  rendition.spread(containerWidth >= READER_SPREAD_MIN_WIDTH ? "always" : "none");
}

/** Tell epub.js to reflow pages after the container size changes. */
export function resizeRendition(
  rendition: Rendition | null,
  el: HTMLElement | null,
  options?: { paginated?: boolean }
): void {
  if (!rendition || !el) return;
  const { width, height } = measureReaderContainer(el);
  if (width > 0 && height > 0) {
    rendition.resize(width, height);
    applyReaderSpread(rendition, width, options?.paginated ?? true);
  }
}
