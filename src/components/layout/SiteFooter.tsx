import Link from "next/link";
import { COMPANY_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import { SiteLogo } from "./SiteLogo";

const footerLinks = {
  library: [
    { href: "/books", label: "Catalog" },
    { href: "/login", label: "Member sign in" },
    { href: "/borrow-policy", label: "Borrowing policy" },
  ],
  company: [
    { href: "/about", label: "About us" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy policy" },
    { href: "/terms", label: "Terms of service" },
  ],
};

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <SiteLogo size="sm" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-600">
              {SITE_TAGLINE}. Encrypted offline reading for borrowed EPUB titles.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
              Library
            </h2>
            <ul className="mt-4 space-y-2">
              {footerLinks.library.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-600 transition hover:text-amber-800"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
              Company
            </h2>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-600 transition hover:text-amber-800"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
              Legal
            </h2>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-600 transition hover:text-amber-800"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-stone-200 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {COMPANY_NAME}. {SITE_NAME} — EPUB library borrowing.
          </p>
          <p>7-day offline access · Encrypted storage · Members only</p>
        </div>
      </div>
    </footer>
  );
}
