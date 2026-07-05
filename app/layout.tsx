import type { Metadata } from "next";
// KaTeX stylesheet must load globally so rendered math is styled everywhere.
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "eXonomist — a LaTeX typesetting game for economists",
  description:
    "Reproduce rendered formulas in LaTeX against the clock. Timed and Zen modes, a live KaTeX preview, and a searchable symbol reference. A LaTeX typesetting game for economists.",
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
