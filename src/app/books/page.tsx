import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Book Catalog</h1>
        <p className="mt-2 text-stone-600">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[2/3] bg-stone-100">
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  fill
                  className="object-cover transition group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-stone-900 line-clamp-2">{book.title}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {book.author.name ?? "Unknown author"}
                </p>
                {book.description && (
                  <p className="mt-2 text-sm text-stone-600 line-clamp-2">{book.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
