import Link from "next/link";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/brand";

const features = [
  {
    title: "7-day offline borrow",
    body: "Encrypted EPUB chunks on your device — read without Wi‑Fi until the borrow expires.",
    icon: "📖",
  },
  {
    title: "Author earnings",
    body: "Reading time and borrows feed transparent payout estimates for creators.",
    icon: "✍️",
  },
  {
    title: "EPUB-only protection",
    body: "Protected streaming, in-memory decryption, and no public file download URLs.",
    icon: "🔒",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-br from-stone-50 via-white to-amber-50/40">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-stone-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
            {SITE_NAME}
          </p>
          <p className="mt-2 text-sm text-stone-500">{SITE_TAGLINE}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Borrow ebooks securely.
            <span className="block text-stone-600 sm:inline sm:text-stone-900">
              {" "}
              Read offline for 7 days.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-600">
            {SITE_DESCRIPTION}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/books"
              className="rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
            >
              Browse catalog
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50"
            >
              Member sign in
            </Link>
            <Link
              href="/my-book-pouch"
              className="rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50"
            >
              My Book Pouch
            </Link>
            <Link
              href="/about"
              className="rounded-lg px-5 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-50"
            >
              About us →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-stone-900 sm:text-3xl">Built for readers & authors</h2>
          <p className="mt-2 text-stone-600">
            A modern library experience with membership, borrowing limits, and installable app
            support for reliable offline reading.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-amber-200/80 hover:shadow-md"
            >
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mt-4 font-semibold text-stone-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Install the app</h2>
            <p className="mt-1 max-w-md text-sm text-stone-600">
              Add {SITE_NAME} to your home screen for faster access and better offline reading on
              mobile.
            </p>
          </div>
          <Link
            href="/borrow-policy"
            className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            How borrowing works
          </Link>
        </div>
      </section>
    </div>
  );
}
