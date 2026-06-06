import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

const CATALOG_DESCRIPTION_MAX = 100;

function truncateDescription(text: string, max = CATALOG_DESCRIPTION_MAX): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export default async function BooksPage() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      isbn: true,
      description: true,
      coverImageUrl: true,
      author: { select: { name: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8 lg:py-10">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          Book Catalog
        </h1>
        <p className="mt-1.5 text-sm text-stone-600 sm:mt-2 sm:text-base">
          Browse titles and borrow with an active membership — 7 days offline access per borrow.
        </p>
      </div>

      {books.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-stone-600">No books published yet.</p>
          <Link href="/author/upload" className="mt-4 inline-block text-amber-700 hover:underline">
            Upload the first title
          </Link>
        </div>
      ) : (
        <div
          className="
            grid grid-cols-2 gap-2.5
            max-md:landscape:grid-cols-4 max-md:landscape:gap-3
            sm:gap-3
            md:grid-cols-3 md:gap-4
            lg:grid-cols-4
            xl:grid-cols-5
            2xl:grid-cols-6
          "
        >
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-xl"
            >
              <div className="relative aspect-[2/3] bg-stone-100">
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  fill
                  className="object-cover transition group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                />
              </div>
              <div className="p-2 sm:p-2.5 md:p-3">
                <h2 className="text-xs font-semibold leading-snug text-stone-900 line-clamp-2 sm:text-sm">
                  {book.title}
                </h2>
                <p className="mt-0.5 text-[11px] text-stone-500 line-clamp-1 sm:mt-1 sm:text-xs">
                  {book.author.name ?? "Unknown author"}
                </p>
                {book.description && (
                  <p className="mt-1 hidden text-xs text-stone-600 line-clamp-2 sm:block">
                    {truncateDescription(book.description)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
