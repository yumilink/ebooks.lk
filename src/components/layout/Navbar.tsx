import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignOutButton } from "./SignOutButton";
import { SiteLogo } from "./SiteLogo";
import { MobileNavMenu, SiteNavLinks } from "./SiteNavLinks";
import type { Role } from "@prisma/client";

const navLinks: Array<{
  href: string;
  label: string;
  roles?: Role[];
}> = [
  { href: "/books", label: "Catalog" },
  { href: "/my-book-pouch", label: "My Book Pouch" },
  { href: "/author/upload", label: "Upload", roles: ["AUTHOR", "ADMIN"] },
  { href: "/author/dashboard", label: "Earnings", roles: ["AUTHOR", "ADMIN"] },
  { href: "/admin/settings", label: "Settings", roles: ["ADMIN"] },
];

export async function Navbar() {
  const session = await getSession();
  const role = session?.user?.role;

  return (
    <header className="relative border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <SiteLogo />

        <SiteNavLinks className="hidden sm:flex" />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks
            .filter((link) => !link.roles || (role && link.roles.includes(role)))
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <MobileNavMenu />
          {session?.user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-stone-900">
                  {session.user.name ?? session.user.email}
                </p>
                <p className="text-xs text-stone-500">{session.user.role}</p>
              </div>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
