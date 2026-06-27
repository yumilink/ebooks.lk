import { Navbar } from "./Navbar";
import { SiteFooter } from "./SiteFooter";
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
      siteFooter={<SiteFooter />}
    >
      {children}
    </ReaderChromeGuard>
  );
}
