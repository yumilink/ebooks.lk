import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  sw: "sw.js",
  customWorkerSrc: "src/worker",
  customWorkerDest: "public",
  customWorkerPrefix: "worker",
  fallbacks: {
    document: "/offline",
  },
});

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

export default withPWA(nextConfig);
