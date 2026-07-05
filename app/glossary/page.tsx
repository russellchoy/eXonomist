import type { Metadata } from "next";
import Link from "next/link";
import { Masthead, LaTeX } from "@/components/Wordmark";
import { GlossaryTable } from "@/components/GlossaryTable";

export const metadata: Metadata = {
  title: "Glossary — eXonomist",
  description: "A cheat-sheet of the most useful LaTeX commands for the game.",
};

export default function GlossaryPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <Link href="/" className="no-underline">
        <Masthead size="small" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Glossary</h1>
        <p className="text-lg text-[var(--muted)]">
          The most useful <LaTeX /> commands for building formulae. No{" "}
          <code className="font-mono font-bold">$</code> signs needed — the game
          wraps every formula for you.
        </p>
      </div>

      <GlossaryTable />

      <div className="border-t-2 border-black pt-6">
        <Link
          href="/play?mode=zen"
          className="border-2 border-black px-6 py-3 text-lg no-underline hover:bg-black hover:text-white"
        >
          Practise in Zen Mode
        </Link>
      </div>
    </main>
  );
}
