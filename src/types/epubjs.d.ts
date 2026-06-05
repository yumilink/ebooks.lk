declare module "epubjs" {
  import type { Rendition } from "epubjs/types/rendition";
  import type { Book } from "epubjs/types/book";

  interface RenditionOptions {
    width?: number | string;
    height?: number | string;
    spread?: "none" | "always" | "auto";
    flow?: "paginated" | "scrolled-doc" | "scrolled-continuous";
  }

  interface Book {
    renderTo(element: Element, options?: RenditionOptions): Rendition;
  }

  function ePub(url: string | ArrayBuffer, options?: object): Book;
  export default ePub;
  export type { Book, Rendition };
}
