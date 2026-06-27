"use client";

import { usePathname } from "next/navigation";

interface ReaderChromeGuardProps {
  children: React.ReactNode;
  siteChrome: React.ReactNode;
  siteFooter: React.ReactNode;
}

export function ReaderChromeGuard({
  children,
  siteChrome,
  siteFooter,
}: ReaderChromeGuardProps) {
  const pathname = usePathname();
  const isReader = pathname?.startsWith("/reader/");

  if (isReader) {
    return <div className="min-h-screen bg-stone-900">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {siteChrome}
      <main className="relative z-0 flex-1">{children}</main>
      {siteFooter}
    </div>
  );
}
