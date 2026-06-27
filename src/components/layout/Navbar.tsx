import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignOutButton } from "./SignOutButton";
import { SiteLogo } from "./SiteLogo";
import { MobileNavMenu, SiteNavLinks, type NavLinkItem } from "./SiteNavLinks";
import type { Role } from "@prisma/client";

const memberNavLinks: Array<{
  href: string;
  label: string;
  roles: Role[];
}> = [
  { href: "/author/upload", label: "Upload", roles: ["AUTHOR", "ADMIN"] },
  { href: "/author/dashboard", label: "Earnings", roles: ["AUTHOR", "ADMIN"] },
  { href: "/admin/settings", label: "Settings", roles: ["ADMIN"] },
];

export async function Navbar() {
  const session = await getSession();
  const role = session?.user?.role;

  const extraLinks: NavLinkItem[] = memberNavLinks
    .filter((link) => role && link.roles.includes(role))
    .map(({ href, label }) => ({ href, label }));

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <SiteLogo />

        <SiteNavLinks className="hidden md:flex" extraLinks={extraLinks} />

        <div className="flex items-center gap-2 sm:gap-3">
          <MobileNavMenu extraLinks={extraLinks} />
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
