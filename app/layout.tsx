import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppShell } from "@/components/system/AppShell";

/*
 * Root layout (server component). Owns fonts, metadata and the document shell.
 * One self-hosted variable family (Geist) — subset and preloaded by next/font,
 * exposed as --font-geist-sans which tokens.css maps to --font-sans (§5, §17).
 * All interactivity is isolated in <AppShell>.
 */

export const metadata: Metadata = {
  title: "Coen — coen.life",
  description:
    "Building ideas that improve how people experience technology.",
  metadataBase: new URL("https://coen.life"),
  openGraph: {
    title: "Coen — coen.life",
    description:
      "Building ideas that improve how people experience technology.",
    url: "https://coen.life",
    siteName: "coen.life",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        {/* Accessible skip link — first focusable element (§17). */}
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
