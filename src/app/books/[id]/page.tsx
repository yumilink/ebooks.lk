import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getValidBorrow } from "@/lib/borrow-verify";
import { hasActiveSubscription } from "@/lib/borrow";
import { BookActions } from "@/components/books/BookActions";

type PageProps = { params: Promise<{ id: string }> };

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      isbn: true,
      description: true,
      coverImageUrl: true,
      createdAt: true,
      author: { select: { name: true, email: true } },
    },
  });

  if (!book) notFound();

  const session = await getSession();
  let borrow = null;
  let canBorrow = false;
  let subscriptionActive = false;

  if (session?.user?.id) {
    borrow = await getValidBorrow(session.user.id, id);
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    subscriptionActive = !!user && hasActiveSubscription(
      user.subscriptionStatus,
      user.subscriptionExpiry
    );
    canBorrow =
      subscriptionActive &&
      (session.user.role === "MEMBER" || session.user.role === "ADMIN");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/books" className="text-sm text-amber-700 hover:underline">
        ← Back to catalog
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[280px_1fr]">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-[280px] overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-md">
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            className="object-cover"
            priority
            sizes="280px"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">{book.title}</h1>
          <p className="mt-2 text-stone-600">
            by {book.author.name ?? book.author.email}
          </p>
          <p className="mt-1 font-mono text-sm text-stone-500">ISBN {book.isbn}</p>

          {book.description && (
            <p className="mt-6 leading-relaxed text-stone-700">{book.description}</p>
          )}

          <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Library access
            </h2>
            <div className="mt-4">
              <BookActions
                bookId={book.id}
                bookTitle={book.title}
                coverImageUrl={book.coverImageUrl}
                canBorrow={canBorrow}
                isLoggedIn={!!session?.user}
                hasActiveBorrow={!!borrow}
                expiresAt={borrow?.expiresAt.toISOString() ?? null}
                subscriptionActive={subscriptionActive}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
