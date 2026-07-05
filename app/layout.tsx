import type { Metadata } from "next";
// KaTeX stylesheet must load globally so rendered math is styled everywhere.
import "katex/dist/katex.min.css";
import "./globals.css";

// Absolute base for OG/Twitter image URLs. Vercel sets VERCEL_URL automatically;
// falls back to localhost in dev. (The favicon is handled automatically by
// app/icon.png — no metadata.icons entry needed.)
const siteUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const title = "eXonomist — a LaTeX typesetting game for economists";
const description =
  "Reproduce rendered formulae in LaTeX against the clock. Timed and Zen modes, a live KaTeX preview, and a searchable symbol reference. A LaTeX typesetting game for economists.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "eXonomist" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-black">
        {children}
      </body>
    </html>
  );
}
