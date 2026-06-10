import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PnlDirectionSync } from "@/components/pnl-direction-sync";
import { DensitySync } from "@/components/density-sync";

export const metadata: Metadata = {
  title: "Folio",
  description: "주식 매매기록 · 포트폴리오 분석 · 시뮬레이션",
  applicationName: "Folio",
  appleWebApp: {
    capable: true,
    title: "Folio",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        <ThemeProvider>
          <PnlDirectionSync />
          <DensitySync />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
