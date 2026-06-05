"use client";

import { useEffect } from "react";
import {
  enforceOfflineExpiry,
  syncPendingReadingLogs,
} from "@/lib/offline/borrow-manager";

export function PwaBootstrap() {
  useEffect(() => {
    async function bootstrap() {
      // Clear stale service workers in dev (they can block CSS/JS)
      if (process.env.NODE_ENV === "development" && "serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      }

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage({ type: "ENFORCE_BORROW_EXPIRY" });
        });
      }

      await enforceOfflineExpiry();
      await syncPendingReadingLogs();
    }

    void bootstrap();

    const onOnline = () => {
      void syncPendingReadingLogs();
      navigator.serviceWorker.controller?.postMessage({ type: "SYNC_READING_LOGS" });
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onOnline);
    };
  }, []);

  return null;
}
