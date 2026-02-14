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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={`${geist.variable} font-sans antialiased`}>
        <ServiceWorkerRegistrar />
        <PlayerProvider>
          <main className="min-h-dvh pb-[calc(3.5rem+4rem)]">{children}</main>
          <BottomNav />
        </PlayerProvider>
      </body>
    </html>
  );
}
