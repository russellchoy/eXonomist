"use client";

import Link from "next/link";
import { Masthead } from "@/components/Wordmark";
import type { GameMode } from "@/components/Game";

/** End-of-game score screen: total score + problems solved, and replay actions. */
export function Results({
  score,
  solved,
  mode,
  onPlayAgain,
}: {
  score: number;
  solved: number;
  mode: GameMode;
  onPlayAgain: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-10 px-6 py-12">
      <Masthead size="small" />

      <div className="w-full border-2 border-black px-8 py-10 text-center">
        <h2 className="mb-6 text-3xl font-bold">
          {mode === "timed" ? "Time's up!" : "Game over"}
        </h2>
        <dl className="flex justify-center gap-16">
          <div>
            <dt className="text-lg text-[var(--muted)]">Score</dt>
            <dd className="text-5xl font-bold tabular-nums">{score}</dd>
          </div>
          <div>
            <dt className="text-lg text-[var(--muted)]">Problems solved</dt>
            <dd className="text-5xl font-bold tabular-nums">{solved}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onPlayAgain}
          className="border-2 border-black px-6 py-3 text-xl hover:bg-black hover:text-white"
        >
          Play Again
        </button>
        <Link
          href="/"
          className="border-2 border-black px-6 py-3 text-xl no-underline hover:bg-black hover:text-white"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
