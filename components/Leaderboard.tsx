"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Masthead } from "@/components/Wordmark";
import { dailyKey, formatSeconds } from "@/lib/daily";
import {
  fetchDaily,
  fetchTimed,
  type DailyEntry,
  type TimedEntry,
} from "@/lib/leaderboard";

const TOP_N = 25;

type Load<E> = { status: "loading" | "ready" | "unconfigured"; entries: E[] };

export function Leaderboard() {
  const [day, setDay] = useState<string | null>(null);
  const [timed, setTimed] = useState<Load<TimedEntry>>({
    status: "loading",
    entries: [],
  });
  const [daily, setDaily] = useState<Load<DailyEntry>>({
    status: "loading",
    entries: [],
  });

  useEffect(() => {
    const k = dailyKey();
    // Client-only initialization: today's key depends on the viewer's clock, so
    // it can't be computed during (server) render without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDay(k);

    fetchTimed()
      .then((r) =>
        setTimed({
          status: r.configured ? "ready" : "unconfigured",
          entries: [...r.entries]
            .sort((a, b) => b.points - a.points || a.at - b.at)
            .slice(0, TOP_N),
        }),
      )
      .catch(() => setTimed({ status: "unconfigured", entries: [] }));

    fetchDaily(k)
      .then((r) =>
        setDaily({
          status: r.configured ? "ready" : "unconfigured",
          entries: [...r.entries]
            .sort((a, b) => a.seconds - b.seconds || a.at - b.at)
            .slice(0, TOP_N),
        }),
      )
      .catch(() => setDaily({ status: "unconfigured", entries: [] }));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
      <Link href="/" className="no-underline">
        <Masthead size="small" />
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Timed — top scores</h2>
        <Board
          load={timed}
          empty="No scores yet — play a Timed game to get on the board."
          rows={timed.entries.map((e, i) => ({
            rank: i + 1,
            name: e.name,
            value: `${e.points} pts`,
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">
          Daily Challenge{day ? ` — ${day}` : ""}
        </h2>
        <p className="text-base text-[var(--muted)]">
          Fastest total time on today&rsquo;s eight questions. Resets each day.
        </p>
        <Board
          load={daily}
          empty="No entries yet today — be the first to finish the Daily Challenge."
          rows={daily.entries.map((e, i) => ({
            rank: i + 1,
            name: e.name,
            value: formatSeconds(e.seconds),
          }))}
        />
      </section>

      <div className="flex flex-wrap gap-4 border-t-2 border-black pt-6">
        <Link
          href="/play?mode=timed"
          className="border-2 border-black px-6 py-3 text-lg no-underline hover:bg-black hover:text-white"
        >
          Play Timed
        </Link>
        <Link
          href="/daily"
          className="border-2 border-black px-6 py-3 text-lg no-underline hover:bg-black hover:text-white"
        >
          Daily Challenge
        </Link>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Names aren&rsquo;t verified — the board is for fun.
      </p>
    </main>
  );
}

function Board({
  load,
  rows,
  empty,
}: {
  load: { status: "loading" | "ready" | "unconfigured" };
  rows: { rank: number; name: string; value: string }[];
  empty: string;
}) {
  if (load.status === "loading") {
    return <p className="text-lg text-[var(--muted)]">Loading…</p>;
  }
  if (load.status === "unconfigured") {
    return (
      <p className="text-lg text-[var(--muted)]">
        The leaderboard isn&rsquo;t set up yet.
      </p>
    );
  }
  if (rows.length === 0) {
    return <p className="text-lg text-[var(--muted)]">{empty}</p>;
  }
  return (
    <ol className="flex flex-col">
      {rows.map((r) => (
        <li
          key={`${r.rank}-${r.name}`}
          className="flex items-center gap-4 border-b border-dotted border-gray-300 py-2 text-lg"
        >
          <span className="w-8 shrink-0 text-right font-bold tabular-nums">
            {r.rank}
          </span>
          <span className="min-w-0 flex-1 truncate">{r.name}</span>
          <span className="shrink-0 font-bold tabular-nums">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}
