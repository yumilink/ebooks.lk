/** Derive 0–100 reading progress from an epub.js relocated event. */
export function progressFromLocation(location: {
  start: {
    percentage: number;
    displayed?: { page: number; total: number };
  };
}): number {
  const displayed = location.start.displayed;
  if (displayed && displayed.total > 0) {
    const page = displayed.page < 1 ? displayed.page + 1 : displayed.page;
    return Math.min(100, Math.max(0, (page / displayed.total) * 100));
  }

  const raw = location.start.percentage;
  if (raw > 0 && raw <= 1) return raw * 100;
  if (raw > 1) return Math.min(100, raw);
  return 0;
}

/** Normalize stored progress (0–1) for API payloads. */
export function progressToFraction(percent: number): number {
  return Math.min(1, Math.max(0, percent / 100));
}
