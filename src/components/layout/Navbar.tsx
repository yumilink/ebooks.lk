import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignOutButton } from "./SignOutButton";
import type { Role } from "@prisma/client";

const navLinks: Array<{
  href: string;
  label: string;
  roles?: Role[];
}> = [
  { href: "/books", label: "Catalog" },
  { href: "/author/upload", label: "Upload", roles: ["AUTHOR", "ADMIN"] },
  { href: "/author/dashboard", label: "Earnings", roles: ["AUTHOR", "ADMIN"] },
  { href: "/admin/settings", label: "Settings", roles: ["ADMIN"] },
];

export async function Navbar() {
  const session = await getSession();
  const role = session?.user?.role;

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900">
          Ebooks<span className="text-amber-700">.lk</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
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

        <div className="flex items-center gap-3">
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
