import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppShell } from "@/components/system/AppShell";
import { profile } from "@/content/profile";

/*
 * Root layout (server component). Owns fonts, metadata and the document shell.
 * One self-hosted variable family (Geist) — subset and preloaded by next/font,
 * exposed as --font-geist-sans which tokens.css maps to --font-sans (§5, §17).
 * All interactivity is isolated in <AppShell>.
 *
 * SEO: the full name "Coen Hatcher-Ross" leads the title, description, and a
 * Person/WebSite JSON-LD block below, so a search for the name resolves here.
 */

const NAME = "Coen Hatcher-Ross";
const SITE_URL = "https://coen.life";
const DESCRIPTION =
  "Coen Hatcher-Ross (Coen) — building ideas that improve how people experience technology. Projects, photography, writing and more.";

export const metadata: Metadata = {
  title: {
    default: `${NAME} — coen.life`,
    template: `%s · ${NAME}`,
  },
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  applicationName: "coen.life",
  keywords: [
    "Coen Hatcher-Ross",
    "Coen Hatcher Ross",
    "Coen",
    "coen.life",
    "Coen Hatcher-Ross portfolio",
    "Coen Hatcher-Ross Canberra",
  ],
  authors: [{ name: NAME, url: SITE_URL }],
  creator: NAME,
  publisher: NAME,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${NAME} — coen.life`,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "coen.life",
    type: "profile",
    firstName: "Coen",
    lastName: "Hatcher-Ross",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: `${NAME} — coen.life`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
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
  // Only real social links (skip unfilled placeholders) become sameAs.
  const sameAs = profile.socials
    .map((s) => s.href)
    .filter((h) => /^https?:\/\//.test(h));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: NAME,
        alternateName: "Coen",
        url: SITE_URL,
        description: profile.heroStatement,
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: NAME,
        description: DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#person` },
        inLanguage: "en",
      },
    ],
  };

  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        {/* Accessible skip link — first focusable element (§17). */}
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
