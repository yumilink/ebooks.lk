import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

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
  fallbacks: {
    document: "/offline",
  },
});

export default pwaEnabled ? withPWA(nextConfig) : nextConfig;
