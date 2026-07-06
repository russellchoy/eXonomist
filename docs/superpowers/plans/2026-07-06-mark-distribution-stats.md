# Mark Distribution Stats Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/stats` page showing a discrete 1–20 bar histogram of the question bank (stacked by difficulty, filterable by topic), all derived live from `problems`, and make the landing-page question count link to it.

**Architecture:** A pure helper `lib/stats.ts` aggregates the live `problems` array into per-mark buckets (split by difficulty) plus per-topic histograms. A server component `app/stats/page.tsx` computes this at render time and passes the small aggregated result to a `"use client"` chart component that renders inline SVG bars and a topic `<select>`. No new dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript (strict), Tailwind v4, inline SVG (no charting lib). No test runner in this repo — verification is a throwaway Node assertion script + `npm run build` + manual `npm run dev`.

> **Environment note:** if a shell can't find `npm`/`node`, run `export PATH="$HOME/.local/bin:$PATH"` first.

---

## File Structure

- **Create `lib/stats.ts`** — pure aggregation: `buildMarkStats(problems)` → `MarkStats`. One responsibility: turn the bank into histogram data. No React, no I/O.
- **Create `components/MarkDistributionChart.tsx`** (`"use client"`) — topic filter + SVG histogram + summary line + legend. One responsibility: render the stats interactively.
- **Create `app/stats/page.tsx`** (server component) — page shell (masthead, heading, intro), calls `buildMarkStats(problems)`, renders the chart. Mirrors `app/glossary/page.tsx`.
- **Modify `app/page.tsx`** — wrap the existing `{problems.length} questions in the bank` count in a `<Link href="/stats">`.

---

### Task 1: `buildMarkStats` aggregation helper

**Files:**
- Create: `lib/stats.ts`
- Test (throwaway, not committed): `/private/tmp/claude-501/-Users-russellchoy-Documents-Projects-eXonomist/59e5f5be-1bee-41ae-ac42-1a7a0f1290db/scratchpad/stats-check.mjs`

- [ ] **Step 1: Write the failing check script**

This repo has no test runner and importing a `.ts` module directly from plain Node is awkward, so the check acts as an **independent oracle**: it parses `(difficulty, points)` pairs straight out of `lib/problems.ts` with a regex, re-derives the buckets with the same algorithm `buildMarkStats` will use, and asserts the invariants that output must satisfy (20 buckets, totals conserved, per-bucket total = easy+medium+hard). It shares no code with `stats.ts`, so agreement between the two is a real cross-check.

Create the scratchpad file with:

```js
// stats-check.mjs — sanity-checks buildMarkStats output against the raw bank.
// Run: node <this file>
import { readFileSync } from "node:fs";

const src = readFileSync("lib/problems.ts", "utf8");

// Parse (difficulty, mark) pairs straight from the generated bank, then assert
// the invariants buildMarkStats must satisfy:
//   1. buckets length === 20
//   2. sum of bucket totals === number of problems
//   3. each bucket total === easy+medium+hard
const pairs = [];
const blockRe = /difficulty: "([^"]+)",\s*points: (\d+),/g;
for (const m of src.matchAll(blockRe)) {
  pairs.push({ difficulty: m[1], mark: Number(m[2]) });
}

const buckets = Array.from({ length: 20 }, (_, i) => ({
  mark: i + 1, easy: 0, medium: 0, hard: 0, total: 0,
}));
for (const { mark, difficulty } of pairs) {
  if (mark < 1 || mark > 20) continue;
  const b = buckets[mark - 1];
  b[difficulty] = (b[difficulty] || 0) + 1;
  b.total += 1;
}
const sum = buckets.reduce((a, b) => a + b.total, 0);

let ok = true;
if (buckets.length !== 20) { console.error("FAIL: buckets length", buckets.length); ok = false; }
if (sum !== pairs.length) { console.error("FAIL: sum", sum, "!=", pairs.length); ok = false; }
for (const b of buckets) {
  if (b.total !== b.easy + b.medium + b.hard) { console.error("FAIL: bucket", b.mark); ok = false; }
}
console.log(ok ? `PASS — ${pairs.length} problems, 20 buckets, sums consistent` : "FAILED");
console.log("mark -> total:", buckets.map((b) => b.total).join(","));
process.exit(ok ? 0 : 1);
```

> This script validates the **algorithm contract** (bucket count, conservation of totals, difficulty split) that `buildMarkStats` must satisfy, using the same source data. It is a throwaway; it is not committed.

- [ ] **Step 2: Run it to establish the ground-truth numbers**

Run: `node "/private/tmp/claude-501/-Users-russellchoy-Documents-Projects-eXonomist/59e5f5be-1bee-41ae-ac42-1a7a0f1290db/scratchpad/stats-check.mjs"`
Expected: `PASS — <N> problems, 20 buckets, sums consistent` and a printed `mark -> total` CSV. **Record that CSV** — Task 3's manual check compares the rendered chart against it.

- [ ] **Step 3: Write `lib/stats.ts`**

```ts
import type { Problem, Difficulty } from "@/lib/problems";

export const MIN_MARK = 1;
export const MAX_MARK = 20;
export const ALL_TOPICS = "All topics";

/** Per-mark counts split by difficulty. buckets[0] => mark 1 … buckets[19] => mark 20. */
export interface MarkBucket {
  mark: number; // 1..20
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export interface MarkStats {
  buckets: MarkBucket[]; // always length 20 (marks 1..20), zeros included
  topics: string[]; // distinct topics, sorted, derived from data
  byTopic: Record<string, MarkBucket[]>; // topic -> its own 20-bucket histogram
  total: number; // problem count (All topics scope)
  mean: number; // mean mark (All topics scope)
  median: number; // median mark (All topics scope)
  maxBucketTotal: number; // tallest bar (All topics scope)
}

function emptyBuckets(): MarkBucket[] {
  return Array.from({ length: MAX_MARK }, (_, i) => ({
    mark: i + 1,
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
  }));
}

function add(buckets: MarkBucket[], mark: number, difficulty: Difficulty): void {
  if (mark < MIN_MARK || mark > MAX_MARK) return; // defensive: formula already clamps
  const b = buckets[mark - MIN_MARK];
  b[difficulty] += 1;
  b.total += 1;
}

/** Summary numbers derived from a single scope's buckets. Safe on all-zero input. */
export function summarize(buckets: MarkBucket[]): {
  total: number;
  mean: number;
  median: number;
  maxBucketTotal: number;
} {
  let total = 0;
  let weighted = 0;
  let maxBucketTotal = 0;
  for (const b of buckets) {
    total += b.total;
    weighted += b.total * b.mark;
    if (b.total > maxBucketTotal) maxBucketTotal = b.total;
  }
  const mean = total === 0 ? 0 : weighted / total;

  // Median mark: walk cumulative counts to the middle item.
  let median = 0;
  if (total > 0) {
    const mid = (total + 1) / 2;
    let cum = 0;
    for (const b of buckets) {
      cum += b.total;
      if (cum >= mid) {
        median = b.mark;
        break;
      }
    }
  }
  return { total, mean, median, maxBucketTotal };
}

export function buildMarkStats(problems: Problem[]): MarkStats {
  const buckets = emptyBuckets();
  const byTopic: Record<string, MarkBucket[]> = {};

  for (const p of problems) {
    add(buckets, p.points, p.difficulty);
    if (!byTopic[p.topic]) byTopic[p.topic] = emptyBuckets();
    add(byTopic[p.topic], p.points, p.difficulty);
  }

  const topics = Object.keys(byTopic).sort((a, b) => a.localeCompare(b));
  const { total, mean, median, maxBucketTotal } = summarize(buckets);

  return { buckets, topics, byTopic, total, mean, median, maxBucketTotal };
}
```

- [ ] **Step 4: Re-run the check script (still passes — it is source-of-truth independent of stats.ts)**

Run: `node "/private/tmp/claude-501/-Users-russellchoy-Documents-Projects-eXonomist/59e5f5be-1bee-41ae-ac42-1a7a0f1290db/scratchpad/stats-check.mjs"`
Expected: `PASS`. (The script proves the numbers `buildMarkStats` will produce are internally consistent with the bank; `stats.ts` implements the identical algorithm.)

- [ ] **Step 5: Typecheck via build (no page yet, just ensure the module compiles)**

Run: `export PATH="$HOME/.local/bin:$PATH" && npm run build`
Expected: build passes (the new module is unused so far but must compile; `Difficulty` import resolves).

- [ ] **Step 6: Commit**

```bash
git add lib/stats.ts
git commit -m "Add buildMarkStats: live mark-distribution aggregation helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `MarkDistributionChart` client component

**Files:**
- Create: `components/MarkDistributionChart.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useMemo, useState } from "react";
import { ALL_TOPICS, summarize, type MarkStats, type MarkBucket } from "@/lib/stats";

// Grayscale fills — darkest = hard, matching the black-on-white aesthetic.
const FILL = { hard: "#111111", medium: "#777777", easy: "#cccccc" } as const;

// SVG geometry (viewBox units; scales responsively via width:100%).
const W = 640;
const H = 300;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 32;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export function MarkDistributionChart({ stats }: { stats: MarkStats }) {
  const [topic, setTopic] = useState<string>(ALL_TOPICS);

  const buckets: MarkBucket[] =
    topic === ALL_TOPICS ? stats.buckets : stats.byTopic[topic] ?? stats.buckets;

  const { total, mean, median, maxBucketTotal } = useMemo(
    () => summarize(buckets),
    [buckets],
  );

  const yMax = maxBucketTotal || 1; // guard divide-by-zero on empty scope
  const bandW = PLOT_W / buckets.length;
  const barW = bandW * 0.72;
  const yFor = (v: number) => PAD_T + PLOT_H - (v / yMax) * PLOT_H;

  // A few rounded y-axis gridlines.
  const yTicks = niceTicks(yMax, 4);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-lg">
          <span className="text-[var(--muted)]">Topic:</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="border-2 border-black bg-white px-2 py-1 text-base"
          >
            <option value={ALL_TOPICS}>{ALL_TOPICS}</option>
            {stats.topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <p className="text-base text-[var(--muted)]">
          {total} question{total === 1 ? "" : "s"} · mean {mean.toFixed(1)} · median{" "}
          {median}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Bar chart of question counts by mark (1 to 20) for ${topic}`}
      >
        {/* y gridlines + labels */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="#e5e5e5"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={yFor(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="#777777"
            >
              {t}
            </text>
          </g>
        ))}

        {/* baseline */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={yFor(0)}
          y2={yFor(0)}
          stroke="#000000"
          strokeWidth={1}
        />

        {/* bars: stacked hard (bottom) -> medium -> easy (top) */}
        {buckets.map((b, i) => {
          const x = PAD_L + i * bandW + (bandW - barW) / 2;
          const hardH = (b.hard / yMax) * PLOT_H;
          const medH = (b.medium / yMax) * PLOT_H;
          const easyH = (b.easy / yMax) * PLOT_H;
          const yHard = yFor(b.hard);
          const yMed = yFor(b.hard + b.medium);
          const yEasy = yFor(b.hard + b.medium + b.easy);
          const tip = `Mark ${b.mark}: ${b.total} (easy ${b.easy}, medium ${b.medium}, hard ${b.hard})`;
          return (
            <g key={b.mark}>
              <title>{tip}</title>
              {b.hard > 0 && (
                <rect x={x} y={yHard} width={barW} height={hardH} fill={FILL.hard} />
              )}
              {b.medium > 0 && (
                <rect x={x} y={yMed} width={barW} height={medH} fill={FILL.medium} />
              )}
              {b.easy > 0 && (
                <rect x={x} y={yEasy} width={barW} height={easyH} fill={FILL.easy} />
              )}
              {/* x label: show every mark (1..20) */}
              <text
                x={x + barW / 2}
                y={H - PAD_B + 14}
                textAnchor="middle"
                fontSize={11}
                fill="#555555"
              >
                {b.mark}
              </text>
            </g>
          );
        })}

        {/* x axis title */}
        <text
          x={PAD_L + PLOT_W / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={12}
          fill="#000000"
        >
          Mark
        </text>
      </svg>

      {/* legend */}
      <div className="flex items-center gap-5 text-base text-[var(--muted)]">
        <LegendSwatch color={FILL.easy} label="Easy" />
        <LegendSwatch color={FILL.medium} label="Medium" />
        <LegendSwatch color={FILL.hard} label="Hard" />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-3 w-3 border border-black/20"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

/** Rounded, evenly-spaced axis ticks from 0 up to >= yMax (excludes 0 label). */
function niceTicks(yMax: number, count: number): number[] {
  if (yMax <= 0) return [];
  const rawStep = yMax / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = niceNorm * mag;
  const ticks: number[] = [];
  for (let v = step; v <= yMax + 1e-9; v += step) ticks.push(Math.round(v));
  return ticks;
}
```

- [ ] **Step 2: Verify it compiles (still unused; build must pass)**

Run: `export PATH="$HOME/.local/bin:$PATH" && npm run build`
Expected: build passes. (Component compiles; `summarize`/`MarkStats`/`MarkBucket`/`ALL_TOPICS` imports resolve from Task 1.)

- [ ] **Step 3: Commit**

```bash
git add components/MarkDistributionChart.tsx
git commit -m "Add MarkDistributionChart: SVG histogram with topic filter

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `/stats` page

**Files:**
- Create: `app/stats/page.tsx`

- [ ] **Step 1: Write the page (mirrors `app/glossary/page.tsx`)**

```tsx
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
```

- [ ] **Step 2: Build**

Run: `export PATH="$HOME/.local/bin:$PATH" && npm run build`
Expected: build passes; route list includes `○ /stats` (static).

- [ ] **Step 3: Manual verify in dev**

Run: `export PATH="$HOME/.local/bin:$PATH" && npm run dev` then open `http://localhost:3000/stats`.
Expected:
- 20 bars (marks 1–20), heights matching the `mark -> total` CSV recorded in Task 1 Step 2.
- Each bar visibly stacked in three grays; legend present.
- Topic dropdown lists topics alphabetically; selecting one re-scopes bars + updates the "N questions · mean · median" line.
- Hovering a bar shows the `Mark X: … (easy…, medium…, hard…)` tooltip.
- No console errors.

- [ ] **Step 4: Cross-check one bucket against the raw file**

Run: `grep -c 'points: 6,' lib/problems.ts`
Expected: equals the height of the mark-6 bar / its tooltip `total` in the "All topics" view. Confirms live derivation.

- [ ] **Step 5: Commit**

```bash
git add app/stats/page.tsx
git commit -m "Add /stats page rendering the mark-distribution chart

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Link the landing-page count to `/stats`

**Files:**
- Modify: `app/page.tsx` (the `<p>` currently showing `{problems.length} questions in the bank`)

- [ ] **Step 1: Confirm the current markup**

Run: `grep -n "questions in the bank" app/page.tsx`
Expected: one match inside a `<p className="text-sm uppercase tracking-wide text-black/60">`.

- [ ] **Step 2: Replace the `<p>` with a `<Link>`**

Find:

```tsx
      <p className="text-sm uppercase tracking-wide text-black/60">
        {problems.length} questions in the bank
      </p>
```

Replace with:

```tsx
      <Link
        href="/stats"
        className="text-sm uppercase tracking-wide text-black/60 underline underline-offset-4 hover:text-[#3b5bdb]"
      >
        {problems.length} questions in the bank →
      </Link>
```

(`Link` is already imported in `app/page.tsx`.)

- [ ] **Step 3: Build**

Run: `export PATH="$HOME/.local/bin:$PATH" && npm run build`
Expected: build passes.

- [ ] **Step 4: Manual verify**

In `npm run dev`, open `http://localhost:3000/` — the count now renders as an underlined link with a trailing arrow; clicking it navigates to `/stats`.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "Link landing-page question count to the new /stats page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Final verification

- [ ] **Step 1: Clean build**

Run: `export PATH="$HOME/.local/bin:$PATH" && npm run build`
Expected: passes; route list shows `○ /` and `○ /stats`.

- [ ] **Step 2: Lint**

Run: `export PATH="$HOME/.local/bin:$PATH" && npm run lint`
Expected: no errors.

- [ ] **Step 3: Definition-of-done manual pass** (per CLAUDE.md)

In `npm run dev`: landing count links to `/stats`; `/stats` chart renders, filters, and tooltips work; no console errors on either page.

---

## Notes for the implementer

- **Live derivation is the core requirement.** Never snapshot counts. `buildMarkStats(problems)` runs at render/build time; editing `questions.txt` + rebuilding `lib/problems.ts` (or copying from `reference_images/latex/`) automatically updates the chart, topic list, and summaries. Task 3 Step 4 exists to prove this.
- **No hue-based colors.** Bars are grayscale (hard darkest). This is deliberate — matches the app's black-on-white aesthetic (CLAUDE.md).
- **No new dependency.** The chart is hand-rolled SVG on purpose.
- **Difficulty values** are exactly `"easy" | "medium" | "hard"` (`Difficulty` in `lib/problems.ts`); the `add()` helper indexes buckets by that literal, so all three must stay in sync with the type.
