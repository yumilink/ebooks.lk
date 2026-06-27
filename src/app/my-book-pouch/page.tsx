import type { Metadata } from "next";
import { BookPouchView } from "@/components/pouch/BookPouchView";
import { SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `My Book Pouch — ${SITE_NAME}`,
  description:
    "Your borrowed ebooks saved on this device for offline reading until the borrow expires.",
};

export default function MyBookPouchPage() {
  return <BookPouchView />;
}
