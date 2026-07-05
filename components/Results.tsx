"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Masthead } from "@/components/Wordmark";
import { submitTimed } from "@/lib/leaderboard";
import type { GameMode } from "@/components/Game";

/** End-of-game score screen: total score + problems solved, replay actions, and
 * (after a timed round) name entry to post the score to the leaderboard. */
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
  const [name, setName] = useState("");
  const [state, setState] = useState<
    "idle" | "submitting" | "done" | "unconfigured" | "error"
  >("idle");

  const canSubmit = mode === "timed" && score > 0;

  const submit = useCallback(async () => {
    if (state === "submitting") return;
    setState("submitting");
    try {
      const res = await submitTimed(name, score);
      if (!res.configured) setState("unconfigured");
      else if (res.ok) setState("done");
      else setState("error");
    } catch {
      setState("error");
    }
  }, [name, score, state]);

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

      {canSubmit && (
        <div className="w-full">
          {state === "done" ? (
            <p className="text-center text-lg">
              Submitted! Your score is on the leaderboard.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="text-lg" htmlFor="timed-name">
                Add your score to the leaderboard:
              </label>
              <div className="flex flex-wrap gap-3">
                <input
                  id="timed-name"
                  type="text"
                  value={name}
                  maxLength={24}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Your name"
                  className="min-w-0 flex-1 rounded-sm border-2 border-black px-4 py-3 text-lg outline-none focus:border-[#3b5bdb]"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={state === "submitting"}
                  className="border-2 border-black px-6 py-3 text-lg hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40"
                >
                  {state === "submitting" ? "Submitting…" : "Submit"}
                </button>
              </div>
              <p className="text-sm text-[var(--muted)]">
                Names aren&rsquo;t verified — please play fair.
              </p>
              {state === "unconfigured" && (
                <p className="text-base text-[var(--muted)]">
                  The leaderboard isn&rsquo;t set up yet, so your score
                  couldn&rsquo;t be saved.
                </p>
              )}
              {state === "error" && (
                <p className="text-base text-red-600">
                  Something went wrong submitting — try again.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={onPlayAgain}
          className="border-2 border-black px-6 py-3 text-xl hover:bg-black hover:text-white"
        >
          Play Again
        </button>
        <Link
          href="/leaderboard"
          className="border-2 border-black px-6 py-3 text-xl no-underline hover:bg-black hover:text-white"
        >
          Leaderboard
        </Link>
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
