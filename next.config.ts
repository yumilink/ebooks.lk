import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { runtimeCaching } from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === "development";
const enablePwaInDev = process.env.ENABLE_PWA === "true";
const pwaEnabled =
  process.env.DISABLE_PWA !== "true" && (!isDev || enablePwaInDev);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [],
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: !pwaEnabled,
  register: pwaEnabled,
  sw: "sw.js",
  customWorkerSrc: "src/worker",
  customWorkerDest: "public",
  customWorkerPrefix: "worker",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  extendDefaultRuntimeCaching: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    runtimeCaching: [
      ...runtimeCaching,
      {
        urlPattern: ({ sameOrigin, url }) =>
          sameOrigin && /^\/reader\/[^/]+$/.test(url.pathname),
        handler: "NetworkFirst",
        options: {
          cacheName: "ebooks-reader-pages",
          expiration: {
            maxEntries: 24,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
          networkTimeoutSeconds: 8,
        },
      },
      {
        urlPattern: ({ sameOrigin, url }) =>
          sameOrigin && url.pathname === "/my-book-pouch",
        handler: "NetworkFirst",
        options: {
          cacheName: "ebooks-pouch-page",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
          networkTimeoutSeconds: 8,
        },
      },
    ],
  },
});

export default pwaEnabled ? withPWA(nextConfig) : nextConfig;
