import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaBootstrap } from "@/components/PwaBootstrap";
import { RegisterPwa } from "@/components/RegisterPwa";
import { AuthSessionProvider } from "@/components/providers/SessionProvider";
import { AppShell } from "@/components/layout/AppShell";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const isDev = process.env.NODE_ENV === "development";
const pwaEnabledInDev = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Digital Library`,
  description: SITE_TAGLINE,
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  ...(!isDev || pwaEnabledInDev
    ? {
        manifest: "/manifest.json",
        appleWebApp: {
          capable: true,
          statusBarStyle: "default",
          title: SITE_NAME,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSessionProvider>
          <RegisterPwa />
          <PwaBootstrap />
          <AppShell>{children}</AppShell>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
