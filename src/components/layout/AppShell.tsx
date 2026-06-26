import { Navbar } from "./Navbar";
import { SecureContextBanner } from "@/components/SecureContextBanner";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { ReaderChromeGuard } from "./ReaderChromeGuard";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ReaderChromeGuard
      siteChrome={
        <>
          <SecureContextBanner />
          <PwaInstallPrompt />
          <Navbar />
        </>
      }
      siteFooter={
        <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
          Secure library borrowing · 7-day offline access · EPUB only
        </footer>
      }
    >
      {children}
    </ReaderChromeGuard>
  );
}
