import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "YTBG Player",
    template: "%s | YTBG",
  },
  description: "YouTube background audio player PWA",
  applicationName: "YTBG Player",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YTBG Player",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geist.variable} font-sans antialiased`}
        style={{
          /* Ensure full viewport height on mobile (iOS Safari address bar) */
          minHeight: "100dvh",
        }}
      >
        <ServiceWorkerRegistrar />
        <PlayerProvider>
          {/*
            Main content area:
            - padding-top: safe area for status bar (handled by Header)
            - padding-bottom: nav bar (49px) + safe area + mini player space (64px)
            The CSS custom properties are set in globals.css
          */}
          <main
            className="main-content"
            style={{
              paddingBottom:
                "calc(var(--bottom-nav-height, 49px) + env(safe-area-inset-bottom, 0px) + var(--mini-player-space, 0px))",
            }}
          >
            {children}
          </main>
          <BottomNav />
        </PlayerProvider>
      </body>
    </html>
  );
}
