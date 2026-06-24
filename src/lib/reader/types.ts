export type ReaderThemeId = "light" | "sepia" | "dark";

export type ReaderFlow = "paginated" | "scrolled";

export interface ReaderPreferences {
  theme: ReaderThemeId;
  fontSize: number;
  fontFamily: string;
  flow: ReaderFlow;
}

export interface TocEntry {
  id: string;
  label: string;
  href: string;
  depth: number;
}

export interface ReaderBookmark {
  id: string;
  cfi: string;
  label: string;
  createdAt: string;
}

export const DEFAULT_PREFERENCES: ReaderPreferences = {
  theme: "light",
  fontSize: 100,
  fontFamily: "Georgia, 'Times New Roman', serif",
  flow: "paginated",
};

export const FONT_SIZE_STEPS = [80, 90, 100, 110, 120, 130, 140, 150] as const;

export const FONT_FAMILY_OPTIONS = [
  { id: "serif", label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { id: "sans", label: "Sans", value: "system-ui, -apple-system, sans-serif" },
  { id: "mono", label: "Mono", value: "ui-monospace, 'Courier New', monospace" },
] as const;

/** Top bar (h-9) + progress strip (h-0.5) — reserve this space for epub content */
export const READER_TOP_CHROME = "2.375rem";

/** Slim offline notice shown below the toolbar when the device has no network */
export const READER_OFFLINE_BANNER = "1.5rem";

/** Side gutter for mobile page-turn buttons (keeps text clear of controls) */
export const READER_SIDE_GUTTER = "2.25rem";

/** Viewport width at which two-page spread is enabled */
export const READER_SPREAD_MIN_WIDTH = 768;
