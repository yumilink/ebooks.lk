"use client";

import { useEffect } from "react";
import {
  enforceOfflineExpiry,
  syncPendingReadingLogs,
} from "@/lib/offline/borrow-manager";
import { warmPwaShellWithPouchReaders } from "@/lib/offline/pwa-shell";

async function unregisterServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((reg) => reg.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

const pwaEnabledInDev = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";
const shouldUseServiceWorker =
  process.env.NODE_ENV !== "development" || pwaEnabledInDev;

if (typeof window !== "undefined" && !shouldUseServiceWorker) {
  void unregisterServiceWorkers();
}

export function PwaBootstrap() {
  useEffect(() => {
    if (!shouldUseServiceWorker) {
      void unregisterServiceWorkers();
      return;
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "ENFORCE_BORROW_EXPIRY" });
        if (navigator.onLine) {
          void warmPwaShellWithPouchReaders();
        }
      });
    }

    const idleId = window.setTimeout(() => {
      void enforceOfflineExpiry();
      void syncPendingReadingLogs();
      if (navigator.onLine) {
        void warmPwaShellWithPouchReaders();
      }
    }, 2500);

    const onOnline = () => {
      void syncPendingReadingLogs();
      navigator.serviceWorker.controller?.postMessage({ type: "SYNC_READING_LOGS" });
      void warmPwaShellWithPouchReaders();
    };

    window.addEventListener("online", onOnline);

    return () => {
      window.clearTimeout(idleId);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
