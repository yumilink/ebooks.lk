"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";

const publicLinks = [
  { href: "/books", label: "Catalog" },
  { href: "/my-book-pouch", label: "My Book Pouch" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

interface SiteNavLinksProps {
  className?: string;
  onNavigate?: () => void;
}

export function SiteNavLinks({ className, onNavigate }: SiteNavLinksProps) {
  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {publicLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className="rounded-md px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-700"
      >
        ☰
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-stone-200 bg-white px-4 py-3 shadow-lg">
            <SiteNavLinks
              className="flex-col items-stretch"
              onNavigate={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
