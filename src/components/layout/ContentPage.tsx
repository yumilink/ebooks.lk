import Link from "next/link";
import { SITE_NAME } from "@/lib/brand";

interface ContentPageProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ContentPage({ title, description, children }: ContentPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
        {SITE_NAME}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-stone-600">{description}</p>
      )}
      <div className="mt-8 space-y-6 text-base leading-relaxed text-stone-700 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-stone-900 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-stone-900 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-amber-800 [&_a]:hover:underline">
        {children}
      </div>
      <p className="mt-12 border-t border-stone-200 pt-6 text-sm text-stone-500">
        <Link href="/" className="text-amber-800 hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
