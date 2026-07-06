# Mark Distribution Stats Page — Design

**Date:** 2026-07-06
**Status:** Approved

## Problem

The question bank now scores every problem on a calibrated 1–20 mark scale
(see the `computedPoints` formula in `reference_images/latex/build-problems.mjs`).
There is no way to *see* how the 1116 questions are spread across that scale, or
how difficulty breaks down by topic. The landing page shows a bare
`"{n} questions in the bank"` count with no way to drill in.

## Goal

Add a **stats page** that visualises the distribution of questions across the
1–20 mark scale as a bar histogram, with a **topic filter** and a
**difficulty breakdown** within each bar. Make the existing landing-page
question count a **link** to this page.

All figures must be **derived live from the `problems` array** so that adding or
re-scoring questions flows through automatically — no snapshots, no hardcoded
counts.

## Decisions (settled during brainstorming)

- **Page scope:** chart **plus** a breakdown by topic and difficulty (not
  chart-only).
- **Chart type:** discrete **bar histogram** — one bar per integer mark 1–20,
  height = count. No smoothing/KDE (marks are exact integers).
- **Difficulty breakdown:** each bar is **stacked by difficulty**
  (easy / medium / hard) using **grayscale shades**, not hue-based colors, to
  match the app's black-on-white aesthetic.
- **Topic breakdown:** a `<select>` dropdown (default "All topics") that
  re-scopes the histogram to a single topic. Topic list is **derived from the
  data**, not hardcoded.
- **Interactivity:** the chart is **static** (no click-to-drill on bars). Bars
  get a native SVG `<title>` hover tooltip with the exact count. The only new
  click target is the landing-page count linking here.
- **No new dependency:** the chart is hand-rolled inline SVG (the app already
  renders KaTeX SVG/HTML and has no charting library; adding one is unjustified
  for a single static histogram).
- **Live derivation:** `buildMarkStats(problems)` recomputes everything from the
  live bank on every build/render. Single source of truth = `lib/problems.ts`.

## Data model

New helper: `lib/stats.ts`.

```ts
import type { Problem, Difficulty } from "@/lib/problems";

export const MIN_MARK = 1;
export const MAX_MARK = 20;

/** Per-mark counts split by difficulty. index 0 => mark 1, index 19 => mark 20. */
export interface MarkBucket {
  mark: number;          // 1..20
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export interface MarkStats {
  buckets: MarkBucket[];          // always length 20 (marks 1..20), zeros included
  topics: string[];               // distinct topics, sorted, derived from data
  byTopic: Record<string, MarkBucket[]>; // topic -> its own 20-bucket histogram
  total: number;                  // problem count in scope
  mean: number;                   // mean mark
  median: number;                 // median mark
  maxBucketTotal: number;         // tallest bar (for y-axis scaling)
}

export function buildMarkStats(problems: Problem[]): MarkStats;
```

Implementation notes:
- Iterate `problems` once. Clamp/guard any mark outside 1–20 (shouldn't happen —
  the formula clamps — but be defensive: skip and it simply won't appear).
- `buckets` always has 20 entries so empty marks render as zero-height gaps.
- `byTopic` holds a full 20-bucket histogram per topic; the client switches
  between `buckets` (All) and `byTopic[selected]` without recomputation.
- `mean`/`median`/`total`/`maxBucketTotal` are recomputed by the client per
  selected scope from the chosen bucket array (cheap — 20 numbers). To keep the
  server/client contract simple, the client derives summary numbers from
  whichever bucket array is active, so `MarkStats.mean/median/total` describe the
  "All topics" scope and per-topic summaries are computed client-side.

## Components & routes

### `app/stats/page.tsx` (server component)
- Imports `problems` and `buildMarkStats`.
- Renders the page shell matching `app/glossary/page.tsx`:
  masthead (`<Masthead size="small">` linking home) + `<h1>` + intro line.
- Shows the "All topics" summary line (total / mean / median).
- Passes `stats` (the aggregated `MarkStats` — small, ~20 numbers × 125 topics)
  as a prop to the client chart. The raw 1116-row `problems` array is **not**
  shipped to the client.
- Adds `export const metadata` (title/description), matching glossary.

### `components/MarkDistributionChart.tsx` (`"use client"`)
- Props: `stats: MarkStats`.
- State: `selectedTopic: string` (default `"All topics"`).
- Derives the active bucket array: `selectedTopic === "All topics"
  ? stats.buckets : stats.byTopic[selectedTopic]`.
- Derives per-scope summary (total, mean, median, maxBucketTotal) from the active
  buckets.
- Renders:
  1. A `<select>` of `["All topics", ...stats.topics]`.
  2. A per-scope summary line (updates with the filter).
  3. An inline SVG bar chart: 20 bars, each stacked hard (darkest) → medium →
     easy (lightest), y-axis scaled to the active `maxBucketTotal`, x-axis
     labelled with marks (1..20), a few y gridlines/labels. Each bar segment has
     a `<title>` tooltip (e.g. `"Mark 6: 142 (easy 40, medium 78, hard 24)"`).
  4. A small grayscale legend (Easy / Medium / Hard).
- Uses CSS variables / Tailwind classes already in the app; grayscale fills via
  inline `fill` values (e.g. `#111` hard, `#888` medium, `#ccc` easy) or
  Tailwind-driven currentColor opacity. Responsive: SVG uses a `viewBox` and
  `width: 100%` so it scales within the `max-w-3xl` container; on narrow screens
  the x labels may thin out (show every other mark) — acceptable.

### `app/page.tsx` (landing — edit)
- Wrap the existing count in a link:
  ```tsx
  <Link href="/stats" className="text-sm uppercase tracking-wide text-black/60
    underline underline-offset-4 hover:text-[#3b5bdb]">
    {problems.length} questions in the bank →
  </Link>
  ```
  Styled consistently with the leaderboard/glossary links already on the page.

## Data flow

```
lib/problems.ts (problems[])            <- single source of truth
        │
        ▼
lib/stats.ts  buildMarkStats(problems)  <- pure, recomputed each build/render
        │  (MarkStats: aggregated counts only)
        ▼
app/stats/page.tsx (server)             <- calls buildMarkStats, renders shell
        │  passes MarkStats as prop
        ▼
components/MarkDistributionChart.tsx    <- client: topic filter + SVG histogram
```

Adding/rescoring questions → `problems[]` changes → `buildMarkStats` re-derives
→ chart + summaries update. No manual step.

## Error handling / edge cases

- Empty/malformed data: `buildMarkStats([])` returns 20 zero buckets, empty
  `topics`, `total: 0`, `mean: 0`, `median: 0`, `maxBucketTotal: 0`. Chart must
  render an axis with no bars and not divide by zero (guard `maxBucketTotal ||
  1` for bar-height scaling).
- A topic with a single question → a single 1-tall bar; fine.
- Marks outside 1–20: defensively skipped in `buildMarkStats` (formula already
  clamps, so this is belt-and-braces).
- Never crashes on render — pure arithmetic + SVG, no KaTeX/user input involved.

## Testing / definition of done

1. `npm run build` passes.
2. `npm run dev`: `/stats` renders the histogram; the topic dropdown re-scopes
   the bars and the summary line; hover tooltips show correct counts; the
   difficulty stacking is visible.
3. Landing-page count links to `/stats`.
4. Manually verify one bucket's count against a quick grep of `lib/problems.ts`
   (e.g. count of `points: 6`) to confirm live derivation.
5. No console errors on `/stats` or the landing page.

## Out of scope (YAGNI)

- Click-to-drill on bars (list questions at a mark). Explicitly declined.
- KDE / smoothed curves.
- Hue-based / branded chart colors.
- A charting-library dependency.
- Persisting or caching stats separately from `problems`.
