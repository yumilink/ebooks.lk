import type { ReaderPreferences, ReaderThemeId } from "@/lib/reader/types";

export const THEME_CHROME: Record<
  ReaderThemeId,
  { shell: string; header: string; border: string; text: string; muted: string }
> = {
  light: {
    shell: "#ffffff",
    header: "#fafaf9",
    border: "#e7e5e4",
    text: "#1c1917",
    muted: "#78716c",
  },
  sepia: {
    shell: "#f4ecd8",
    header: "#ebe3cf",
    border: "#d6cbb8",
    text: "#5c4b37",
    muted: "#8b7355",
  },
  dark: {
    shell: "#292524",
    header: "#1c1917",
    border: "#44403c",
    text: "#f5f5f4",
    muted: "#a8a29e",
  },
};

const THEME_PALETTE: Record<ReaderThemeId, { bg: string; fg: string; link: string }> = {
  light: { bg: "#ffffff", fg: "#1c1917", link: "#b45309" },
  sepia: { bg: "#f4ecd8", fg: "#5c4b37", link: "#92400e" },
  dark: { bg: "#292524", fg: "#f5f5f4", link: "#fbbf24" },
};

/** Full CSS injected into each EPUB section (paginated + scroll). */
export function buildThemeCss(theme: ReaderThemeId): string {
  const { bg, fg, link } = THEME_PALETTE[theme];
  return `
    html, body {
      background: ${bg} !important;
      background-color: ${bg} !important;
      color: ${fg} !important;
    }
    body, body * {
      color: ${fg} !important;
    }
    a, a *, a:visited, a:visited * {
      color: ${link} !important;
    }
    p, span, div, section, article, li, td, th, blockquote,
    h1, h2, h3, h4, h5, h6, figcaption, label, em, strong, i, b, small {
      background-color: transparent !important;
    }
  `;
}

/** Register epub.js iframe themes and apply font settings. */
export function applyReaderTheme(
  themes: {
    registerCss: (name: string, css: string) => void;
    select: (name: string) => void;
    fontSize: (size: string) => void;
    font: (family: string) => void;
    override: (name: string, value: string, priority?: boolean) => void;
  },
  prefs: ReaderPreferences
): void {
  for (const theme of ["light", "sepia", "dark"] as const) {
    themes.registerCss(theme, buildThemeCss(theme));
  }

  themes.select(prefs.theme);
  themes.fontSize(`${prefs.fontSize}%`);
  themes.font(prefs.fontFamily);
  themes.override("line-height", "1.6", true);
}

export function injectThemeIntoDocument(doc: Document, theme: ReaderThemeId): void {
  let style = doc.getElementById("ebooks-lk-reader-theme") as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = "ebooks-lk-reader-theme";
    doc.head.appendChild(style);
  }
  style.textContent = buildThemeCss(theme);
}

export function attachReaderContentHooks(
  rendition: {
    hooks: {
      content: { register: (fn: (contents: { document: Document }) => void) => void };
    };
  },
  getTheme: () => ReaderThemeId
): void {
  rendition.hooks.content.register((contents) => {
    injectThemeIntoDocument(contents.document, getTheme());
  });
}

export function flattenToc(
  items: Array<{ id: string; label: string; href: string; subitems?: typeof items }>,
  depth = 0
): Array<{ id: string; label: string; href: string; depth: number }> {
  const result: Array<{ id: string; label: string; href: string; depth: number }> = [];
  for (const item of items) {
    result.push({
      id: item.id,
      label: item.label.trim(),
      href: item.href,
      depth,
    });
    if (item.subitems?.length) {
      result.push(...flattenToc(item.subitems, depth + 1));
    }
  }
  return result;
}
