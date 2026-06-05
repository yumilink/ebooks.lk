import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-amber-700">
          Digital library
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Borrow ebooks securely, read offline for 7 days.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-stone-600">
          Ebooks.lk is a library-style storefront with encrypted offline borrowing,
          author revenue tracking, and strict EPUB-only content protection.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/books"
            className="rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Browse catalog
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            Member sign in
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "7-day offline borrow",
            body: "Encrypted EPUB chunks stored locally with strict expiry enforcement.",
          },
          {
            title: "Author earnings",
            body: "Reading time and borrows drive dynamic payout estimates.",
          },
          {
            title: "EPUB-only DRM",
            body: "Protected streaming, in-memory decryption, no static file URLs.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-semibold text-stone-900">{item.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
