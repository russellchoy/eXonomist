"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { problems } from "@/lib/problems";
import { isCorrect } from "@/lib/checkAnswer";
import { dailyIndices, dailyKey, DAILY_COUNT, formatSeconds } from "@/lib/daily";
import { submitDaily } from "@/lib/leaderboard";
import { Masthead } from "@/components/Wordmark";
import { Target } from "@/components/Target";
import { Preview } from "@/components/Preview";
import { LatexInput } from "@/components/LatexInput";
import { HintList } from "@/components/HintList";
import { GlossaryPanel } from "@/components/GlossaryPanel";

type Phase = "loading" | "intro" | "playing" | "finished";
interface PriorResult {
  name: string;
  seconds: number;
}

const lockKey = (day: string) => `exo-daily-${day}`;

// Defined at module level so its identity is stable across renders — an inline
// definition would give React a new component type every stopwatch tick and
// remount the whole subtree (stealing textarea focus, closing the glossary).
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
      <Link href="/" className="no-underline">
        <Masthead size="small" />
      </Link>
      {children}
    </div>
  );
}

export function DailyChallenge() {
  const [day, setDay] = useState<string | null>(null);
  const [prior, setPrior] = useState<PriorResult | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  // Client-only: today's key + whether this device already completed it.
  useEffect(() => {
    const k = dailyKey();
    // Client-only initialization: the day key and localStorage lock can only be
    // read in the browser — same canonical pattern as the shuffle in Game.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDay(k);
    try {
      const raw = localStorage.getItem(lockKey(k));
      if (raw) {
        // Guard the shape, not just the parse — corrupt-but-valid JSON (e.g. `{}`)
        // would otherwise render `NaN:NaN` on the already-done screen.
        const parsed: unknown = JSON.parse(raw);
        if (
          parsed !== null &&
          typeof parsed === "object" &&
          typeof (parsed as PriorResult).name === "string" &&
          Number.isFinite((parsed as PriorResult).seconds)
        ) {
          setPrior(parsed as PriorResult);
        }
      }
    } catch {
      /* ignore */
    }
    setPhase("intro");
  }, []);

  const indices = useMemo(() => (day ? dailyIndices(day) : []), [day]);

  // Play state.
  const [pos, setPos] = useState(0);
  const [input, setInput] = useState("");
  const [shadow, setShadow] = useState(false);
  const [flash, setFlash] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(0);
  const [finalSeconds, setFinalSeconds] = useState<number | null>(null);
  const transitioning = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = phase === "playing" && indices.length ? problems[indices[pos]] : null;
  const elapsed = startTs !== null ? (Math.max(nowTs, startTs) - startTs) / 1000 : 0;

  // Stopwatch tick while playing.
  useEffect(() => {
    if (phase !== "playing" || startTs === null) return;
    const id = setInterval(() => setNowTs(Date.now()), 250);
    return () => clearInterval(id);
  }, [phase, startTs]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const start = useCallback(() => {
    setPos(0);
    setInput("");
    setHintsShown(0);
    setFlash(false);
    setFinalSeconds(null);
    const t = Date.now();
    setStartTs(t);
    setNowTs(t);
    setPhase("playing");
  }, []);

  const revealHint = useCallback(() => {
    if (current) setHintsShown((n) => Math.min(n + 1, current.hints.length));
  }, [current]);

  const handleInput = useCallback(
    (next: string) => {
      if (transitioning.current || !current) return;
      setInput(next);
      if (next.trim() && isCorrect(next, current.latex)) {
        transitioning.current = true;
        setFlash(true);
        advanceTimer.current = setTimeout(() => {
          setFlash(false);
          transitioning.current = false;
          if (pos + 1 >= indices.length) {
            setFinalSeconds((Date.now() - (startTs ?? Date.now())) / 1000);
            setPhase("finished");
          } else {
            setPos((p) => p + 1);
            setInput("");
            setHintsShown(0);
          }
        }, 450);
      }
    },
    [current, pos, indices.length, startTs],
  );

  // Submission (finished phase).
  const [name, setName] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "done" | "duplicate" | "unconfigured" | "error"
  >("idle");

  const submit = useCallback(async () => {
    if (!day || finalSeconds === null || submitState === "submitting") return;
    setSubmitState("submitting");
    try {
      const res = await submitDaily(name, finalSeconds, day);
      if (!res.configured) {
        setSubmitState("unconfigured");
      } else if (res.ok) {
        const result: PriorResult = {
          name: name.trim() || "Anonymous",
          seconds: Math.round(finalSeconds),
        };
        try {
          localStorage.setItem(lockKey(day), JSON.stringify(result));
        } catch {
          /* ignore */
        }
        setPrior(result);
        setSubmitState(res.duplicate ? "duplicate" : "done");
      } else {
        setSubmitState("error");
      }
    } catch {
      setSubmitState("error");
    }
  }, [day, finalSeconds, name, submitState]);

  if (phase === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-lg text-[var(--muted)]">
        Loading today&rsquo;s challenge…
      </div>
    );
  }

  // Already completed today (one attempt per day).
  if (phase === "intro" && prior) {
    return (
      <Shell>
        <div className="border-2 border-black px-8 py-10 text-center">
          <h2 className="mb-3 text-2xl font-bold">
            You&rsquo;ve done today&rsquo;s Daily Challenge
          </h2>
          <p className="text-lg">
            Your time:{" "}
            <span className="font-bold tabular-nums">
              {formatSeconds(prior.seconds)}
            </span>{" "}
            as <span className="font-bold">{prior.name}</span>
          </p>
          <p className="mt-2 text-base text-[var(--muted)]">
            One attempt per day — come back tomorrow for a fresh set.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/leaderboard"
            className="border-2 border-black px-6 py-3 text-lg no-underline hover:bg-black hover:text-white"
          >
            Today&rsquo;s Leaderboard
          </Link>
          <Link
            href="/play?mode=zen"
            className="border-2 border-black px-6 py-3 text-lg no-underline hover:bg-black hover:text-white"
          >
            Practise (Zen)
          </Link>
        </div>
      </Shell>
    );
  }

  // Intro / rules.
  if (phase === "intro") {
    return (
      <Shell>
        <div className="border-2 border-black px-8 py-10">
          <h2 className="mb-4 text-2xl font-bold">Daily Challenge — {day}</h2>
          <ul className="ml-6 flex list-disc flex-col gap-2 text-lg">
            <li>{DAILY_COUNT} questions, the same for everyone today.</li>
            <li>The clock counts up — fastest total time wins.</li>
            <li>You must solve all {DAILY_COUNT}; hints are free here.</li>
            <li className="font-bold">
              One attempt per day — your first completed run is your entry.
            </li>
            <li>Names aren&rsquo;t verified, so please play fair.</li>
          </ul>
          <button
            type="button"
            onClick={start}
            className="mt-6 border-2 border-black px-6 py-3 text-xl hover:bg-black hover:text-white"
          >
            Start the clock
          </button>
        </div>
        <Link
          href="/leaderboard"
          className="text-lg underline underline-offset-4 hover:text-[#3b5bdb]"
        >
          See today&rsquo;s leaderboard →
        </Link>
      </Shell>
    );
  }

  // Finished.
  if (phase === "finished") {
    return (
      <Shell>
        <div className="border-2 border-black px-8 py-10 text-center">
          <p className="mb-1 text-base text-[var(--muted)]">Daily Challenge · {day}</p>
          <h2 className="mb-4 text-3xl font-bold">Daily Challenge complete!</h2>
          <p className="text-lg text-[var(--muted)]">Your time</p>
          <p className="text-6xl font-bold tabular-nums">
            {formatSeconds(finalSeconds ?? 0)}
          </p>
        </div>

        {submitState === "done" || submitState === "duplicate" ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-lg">
              {submitState === "duplicate"
                ? "You already have an entry for today — keeping your first one."
                : "Submitted! You're on today's board."}
            </p>
            <div className="flex gap-4">
              <Link
                href="/leaderboard"
                className="border-2 border-black px-6 py-3 text-lg no-underline hover:bg-black hover:text-white"
              >
                Today&rsquo;s Leaderboard
              </Link>
              <Link
                href="/"
                className="border-2 border-black px-6 py-3 text-lg no-underline hover:bg-black hover:text-white"
              >
                Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="text-lg" htmlFor="daily-name">
              Enter your name for the leaderboard:
            </label>
            <div className="flex flex-wrap gap-3">
              <input
                id="daily-name"
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
                disabled={submitState === "submitting"}
                className="border-2 border-black px-6 py-3 text-lg hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40"
              >
                {submitState === "submitting" ? "Submitting…" : "Submit"}
              </button>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Names aren&rsquo;t verified — please play fair.
            </p>
            {submitState === "unconfigured" && (
              <p className="text-base text-[var(--muted)]">
                The leaderboard isn&rsquo;t set up yet, so your time couldn&rsquo;t
                be saved — but nice work!
              </p>
            )}
            {submitState === "error" && (
              <p className="text-base text-red-600">
                Something went wrong submitting — try again.
              </p>
            )}
          </div>
        )}
      </Shell>
    );
  }

  // Playing.
  return (
    <Shell>
      <p className="text-base text-[var(--muted)]">Daily Challenge · {day}</p>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <Link
          href="/"
          className="border-2 border-black px-4 py-2 text-base no-underline hover:bg-black hover:text-white"
        >
          Quit
        </Link>
        <div className="flex items-center gap-8 text-xl">
          <span>
            <span className="font-bold">Problem:</span>{" "}
            <span className="tabular-nums">
              {pos + 1}/{indices.length}
            </span>
          </span>
          <span>
            <span className="font-bold">Time:</span>{" "}
            <span className="tabular-nums">{formatSeconds(elapsed)}</span>
          </span>
        </div>
      </div>

      {current && (
        <>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold">
              {current.title}{" "}
              <span className="font-normal">
                ({current.topic} · {current.points} points)
              </span>
            </h2>
            {flash && (
              <span className="text-xl font-bold text-green-700">✓ Correct!</span>
            )}
          </div>

          {current.context && (
            <div className="border-2 border-black px-4 py-3">
              <p className="mb-1 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
                Context
              </p>
              <p className="text-base">{current.context}</p>
            </div>
          )}
          <Target latex={current.latex} />
          <Preview latex={input} shadowLatex={current.latex} shadow={shadow} />
          <LatexInput
            key={`${day}-${pos}-${current.id}`}
            value={input}
            onChange={handleInput}
            shadow={shadow}
            onToggleShadow={setShadow}
          />

          {current.hints.length > 0 && (
            <button
              type="button"
              onClick={revealHint}
              disabled={hintsShown >= current.hints.length}
              className="inline-flex w-fit items-center gap-2 border-2 border-black px-4 py-2 text-base hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40"
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
                    ? "Show Hint"
                    : `Next Hint (${hintsShown}/${current.hints.length})`}
              </span>
            </button>
          )}
          <HintList hints={current.hints} shown={hintsShown} />
          <GlossaryPanel />
        </>
      )}
    </Shell>
  );
}
