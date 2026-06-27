"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/brand";
import { isSecureCryptoContext } from "@/lib/crypto/secure-context";

const DISMISS_KEY = "ebooks-lk-pwa-install-dismissed";

const pwaActive =
  process.env.NODE_ENV !== "development" ||
  process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

function isInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!pwaActive || !isSecureCryptoContext() || isInstalledPwa()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIosHint(false);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIosDevice()) {
      setIosHint(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setVisible(false);
    }
  }, [deferredPrompt]);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install app"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Install {SITE_NAME} on your device</p>
          {iosHint ? (
            <p className="mt-1 text-xs text-amber-900/80">
              Tap the <strong>Share</strong> button in Safari, then{" "}
              <strong>Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-900/80">
              Open borrowed books offline from your home screen.
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!iosHint && deferredPrompt && (
            <Button type="button" className="py-2" onClick={() => void install()}>
              Install app
            </Button>
          )}
          <Button type="button" variant="secondary" className="py-2" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
