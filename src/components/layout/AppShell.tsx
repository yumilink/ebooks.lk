import { Navbar } from "./Navbar";
import { SecureContextBanner } from "@/components/SecureContextBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <SecureContextBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        Secure library borrowing · 7-day offline access · EPUB only
      </footer>
    </div>
  );
}
