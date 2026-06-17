import {
  DEFAULT_PREFERENCES,
  FONT_SIZE_STEPS,
  type ReaderPreferences,
  type ReaderThemeId,
} from "@/lib/reader/types";

const STORAGE_KEY = "ebooks-lk-reader-preferences";

export function loadReaderPreferences(): ReaderPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      fontSize: clampFontSize(parsed.fontSize ?? DEFAULT_PREFERENCES.fontSize),
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveReaderPreferences(prefs: ReaderPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function clampFontSize(size: number): number {
  const steps = FONT_SIZE_STEPS as readonly number[];
  let closest = steps[0]!;
  for (const step of steps) {
    if (Math.abs(step - size) < Math.abs(closest - size)) closest = step;
  }
  return closest;
}

function isTheme(value: unknown): value is ReaderThemeId {
  return value === "light" || value === "sepia" || value === "dark";
}
