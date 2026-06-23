"use client";

import { useEffect } from "react";
import {
  enforceOfflineExpiry,
  syncPendingReadingLogs,
} from "@/lib/offline/borrow-manager";

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
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "ENFORCE_BORROW_EXPIRY" });
      });
    }

    const idleId = window.setTimeout(() => {
      void enforceOfflineExpiry();
      void syncPendingReadingLogs();
    }, 2500);

    const onOnline = () => {
      void syncPendingReadingLogs();
      navigator.serviceWorker.controller?.postMessage({ type: "SYNC_READING_LOGS" });
    };

    window.addEventListener("online", onOnline);

    return () => {
      window.clearTimeout(idleId);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
