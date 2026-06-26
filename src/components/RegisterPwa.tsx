"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    workbox?: { register: () => void };
  }
}

const shouldRegister =
  process.env.NODE_ENV !== "development" ||
  process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

/** Ensures next-pwa registers /sw.js (required for install prompt on Chrome/Android). */
export function RegisterPwa() {
  useEffect(() => {
    if (!shouldRegister || !("serviceWorker" in navigator)) return;

    if (window.workbox) {
      window.workbox.register();
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* registration retried on next visit */
    });
  }, []);

  return null;
}
