import Link from "next/link";
import { SITE_NAME } from "@/lib/brand";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          {SITE_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">You are offline</h1>
        <p className="mt-3 text-stone-600">
          Borrowed books in your pouch stay available until the 7-day period ends. Open
          your pouch or continue reading a saved title.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/my-book-pouch">
            <Button type="button" className="w-full sm:w-auto">
              My Book Pouch
            </Button>
          </Link>
          <Link href="/books">
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              Catalog
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
