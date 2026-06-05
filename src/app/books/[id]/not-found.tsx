import Link from "next/link";

export default function BookNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">Book not found</h1>
      <p className="mt-2 text-stone-600">This title may have been removed from the catalog.</p>
      <Link href="/books" className="mt-6 inline-block text-amber-700 hover:underline">
        Back to catalog
      </Link>
    </div>
  );
}
