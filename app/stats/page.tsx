import type { Metadata } from "next";
import Link from "next/link";
import { Masthead, LaTeX } from "@/components/Wordmark";
import { MarkDistributionChart } from "@/components/MarkDistributionChart";
import { buildMarkStats } from "@/lib/stats";
import { problems } from "@/lib/problems";

export const metadata: Metadata = {
  title: "Stats — eXonomist",
  description: "How the question bank is distributed across the 1–20 mark scale.",
};

export default function StatsPage() {
  const stats = buildMarkStats(problems);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <Link href="/" className="no-underline">
        <Masthead size="small" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Question distribution</h1>
        <p className="text-lg text-[var(--muted)]">
          Every question is scored 1–20 by a complexity formula. This is how the{" "}
          {stats.total} questions in the bank spread across that scale — mean mark{" "}
          {stats.mean.toFixed(1)}, median {stats.median}. Filter by topic, and see
          the <LaTeX /> difficulty split within each bar.
        </p>
      </div>

      <MarkDistributionChart stats={stats} />

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
