"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { problems } from "@/lib/problems";
import { isCorrect } from "@/lib/checkAnswer";
import { Masthead } from "@/components/Wordmark";
import { Target } from "@/components/Target";
import { Preview } from "@/components/Preview";
import { LatexInput } from "@/components/LatexInput";
import { ReferenceTable } from "@/components/ReferenceTable";
import { HintList } from "@/components/HintList";
import { GlossaryPanel } from "@/components/GlossaryPanel";
import { Results } from "@/components/Results";

export type GameMode = "timed" | "zen";

const TIMED_SECONDS = 180; // 3-minute timed game, matching the original.

/** Fisher–Yates shuffle of [0..n). */
function shuffledIndices(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Game({ mode }: { mode: GameMode }) {
  // Start in deterministic (file) order so server and client first paint match,
  // then shuffle on mount (see effect below). This renders a real problem
  // immediately instead of a loading flash, with no hydration mismatch.
  const [order, setOrder] = useState<number[]>(() =>
    problems.map((_, i) => i),
  );
  const [pos, setPos] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);

  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    mode === "timed" ? TIMED_SECONDS : null,
  );
  const [finished, setFinished] = useState(false);
  const [shadow, setShadow] = useState(false);
  const [flash, setFlash] = useState(false);
  // Hints revealed for the current problem, and points awarded on the last solve
  // (may be reduced by the timed-mode hint penalty — shown in the success flash).
  const [hintsShown, setHintsShown] = useState(0);
  const [lastAward, setLastAward] = useState(0);

  // Guards against re-awarding while the success flash plays out.
  const transitioning = useRef(false);
  // Tracks the pending auto-advance timeout so it can be cleared on unmount.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ready = order.length > 0;
  // Game is over on an explicit End Game, or when the timed clock hits zero.
  const isFinished = finished || secondsLeft === 0;
  const current = ready ? problems[order[pos % order.length]] : null;

  // Shuffle only after mount so server and client first paint match (Math.random
  // in a lazy initializer would diverge and cause a hydration mismatch). This is
  // the canonical client-only-randomization use of an effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrder(shuffledIndices(problems.length)), []);

  // Cancel any pending auto-advance timeout if the component unmounts mid-flash.
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  // Countdown timer for timed mode. Re-subscribes only when the game ends
  // (isFinished flips at 0), not on every tick.
  useEffect(() => {
    if (mode !== "timed" || isFinished || !ready) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [mode, isFinished, ready]);

  const advance = useCallback(() => {
    setInput("");
    setHintsShown(0);
    setQuestionNumber((n) => n + 1);
    setPos((p) => {
      const next = p + 1;
      if (next >= order.length) {
        // Reshuffle for a fresh pass when the deck is exhausted.
        setOrder(shuffledIndices(problems.length));
        return 0;
      }
      return next;
    });
  }, [order.length]);

  const handleInput = useCallback(
    (next: string) => {
      if (transitioning.current || !current) return;
      setInput(next);
      if (next.trim() && isCorrect(next, current.latex)) {
        transitioning.current = true;
        // Timed mode docks 1 point per hint revealed; a solve is always worth ≥1.
        const penalty = mode === "timed" ? hintsShown : 0;
        const awarded = Math.max(1, current.points - penalty);
        setScore((s) => s + awarded);
        setLastAward(awarded);
        setSolved((n) => n + 1);
        setFlash(true);
        advanceTimer.current = setTimeout(() => {
          setFlash(false);
          advance();
          transitioning.current = false;
        }, 450);
      }
    },
    [current, advance, mode, hintsShown],
  );

  const revealHint = useCallback(() => {
    if (!current) return;
    setHintsShown((n) => Math.min(n + 1, current.hints.length));
  }, [current]);

  const skip = useCallback(() => {
    if (transitioning.current) return;
    advance();
  }, [advance]);

  const playAgain = useCallback(() => {
    transitioning.current = false;
    setOrder(shuffledIndices(problems.length));
    setPos(0);
    setQuestionNumber(1);
    setInput("");
    setScore(0);
    setSolved(0);
    setHintsShown(0);
    setSecondsLeft(mode === "timed" ? TIMED_SECONDS : null);
    setFlash(false);
    setFinished(false);
  }, [mode]);

  if (isFinished) {
    return (
      <Results
        score={score}
        solved={solved}
        mode={mode}
        onPlayAgain={playAgain}
      />
    );
  }

  if (!ready || !current) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-lg text-[var(--muted)]">
        Loading problems…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
      <Link href="/" className="no-underline">
        <Masthead size="small" />
      </Link>

      {/* Control + status bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={skip}
            className="border-2 border-black px-4 py-2 text-base hover:bg-black hover:text-white"
          >
            Skip This Problem
          </button>
          <button
            type="button"
            onClick={() => setFinished(true)}
            className="border-2 border-black px-4 py-2 text-base hover:bg-black hover:text-white"
          >
            End Game
          </button>
        </div>
        <div className="flex items-center gap-8 text-xl">
          <span>
            <span className="font-bold">Score:</span>{" "}
            <span className="tabular-nums">{score}</span>
          </span>
          <span>
            <span className="font-bold">Time:</span>{" "}
            <span className="tabular-nums">
              {secondsLeft === null ? "∞" : formatTime(secondsLeft)}
            </span>
          </span>
        </div>
      </div>

      {/* Problem heading */}
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-bold">
          Problem {questionNumber}: {current.title}{" "}
          <span className="font-normal">({current.points} points)</span>
        </h2>
        {flash && (
          <span className="text-xl font-bold text-green-700">
            ✓ Correct! +{lastAward}
          </span>
        )}
      </div>

      <GlossaryPanel />

      <Target latex={current.latex} />
      <Preview latex={input} shadowLatex={current.latex} shadow={shadow} />
      {/* key per question => fresh, auto-focused editor each problem. The Hint
          button rides on the editor's label row so it stays in view; revealed
          hints appear directly under the editor field. */}
      <LatexInput
        key={`${questionNumber}-${current.id}`}
        value={input}
        onChange={handleInput}
        shadow={shadow}
        onToggleShadow={setShadow}
        headerRight={
          current.hints.length > 0 ? (
            <button
              type="button"
              onClick={revealHint}
              disabled={hintsShown >= current.hints.length}
              className="inline-flex items-center gap-2 border-2 border-black px-4 py-2 text-base hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40"
            >
              <svg
                viewBox="0 0 24 24"
                width="1.1em"
                height="1.1em"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <path d="M9 18h6" />
                <path d="M10 21h4" />
                <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.45.9 1.1 1 1.8l.1.4h5l.1-.4c.1-.7.4-1.35 1-1.8A6 6 0 0 0 12 3z" />
              </svg>
              <span>
                {hintsShown >= current.hints.length
                  ? "No more hints"
                  : hintsShown === 0
                    ? `Show Hint${mode === "timed" ? " (−1 pt)" : ""}`
                    : `Next Hint (${hintsShown}/${current.hints.length})${mode === "timed" ? " −1 pt" : ""}`}
              </span>
            </button>
          ) : null
        }
      />
      <HintList hints={current.hints} shown={hintsShown} />

      <ReferenceTable />
    </div>
  );
}
