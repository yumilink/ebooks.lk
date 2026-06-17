declare module "epubjs" {
  import type { Rendition } from "epubjs/types/rendition";
  import type { Book } from "epubjs/types/book";

  interface RenditionOptions {
    width?: number | string;
    height?: number | string;
    spread?: "none" | "always" | "auto";
  minSpreadWidth?: number;
    flow?: "paginated" | "scrolled-doc" | "scrolled-continuous";
  }

  interface NavItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavItem[];
  }

  interface Book {
    ready: Promise<void>;
    loaded: {
      navigation: Promise<{ toc: NavItem[] }>;
    };
    locations: {
      generate(chars: number): Promise<unknown>;
      percentageFromCfi?(cfi: string): number;
    };
    renderTo(element: Element, options?: RenditionOptions): Rendition;
  }

  interface RenditionThemes {
    registerCss(name: string, css: string): void;
    select(name: string): void;
    fontSize(size: string): void;
    font(family: string): void;
    override(name: string, value: string, priority?: boolean): void;
  }

  interface Rendition {
    themes: RenditionThemes;
    hooks: {
      content: {
        register: (fn: (contents: { document: Document }) => void) => void;
      };
    };
    display(target?: string | number): Promise<void>;
    next(): Promise<void>;
    prev(): Promise<void>;
    currentLocation(): {
      start: {
        cfi: string;
        href: string;
        percentage: number;
        displayed?: { page: number; total: number };
      };
    };
    on(
      type: string,
      listener: (location: {
        start: {
          cfi: string;
          href: string;
          percentage: number;
          displayed?: { page: number; total: number };
        };
      }) => void
    ): void;
    destroy(): void;
    resize(width: number, height: number): void;
    spread(mode: "none" | "always" | "auto", minWidth?: number): void;
  }

  function ePub(url: string | ArrayBuffer, options?: object): Book;
  export default ePub;
  export type { Book, Rendition };
}
