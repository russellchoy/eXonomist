# Hints Feature — Design

**Date:** 2026-07-05
**Status:** Approved

## Problem

Players who get stuck on a formula have no guidance on *which* LaTeX commands to
use. The hardest part of reproducing a target is often knowing the command for a
tricky construct — a piecewise `\begin{cases}`, an accent like `\tilde`, or
uncommon Greek like `\varepsilon`. The full `ReferenceTable` is available but is a
200+ entry haystack; it is not targeted to the problem at hand.

## Goal

Give the player, on demand, a **progressive** set of hints that name the
non-obvious commands actually used in the current target formula — without ever
revealing the full answer.

## Decisions (settled during brainstorming)

- **Reveal style:** progressive, one command at a time (trickiest first).
- **Hint storage:** a `hints` array on each `Problem` in the dictionary,
  auto-generated at build time for all 366 problems.
- **Scoring:** penalty applies in **Timed mode only** — free in Zen.
  - Penalty magnitude: **−1 point per hint revealed, floored at 1.**
- **Curation:** a dedicated hint-command dictionary, separate from
  `lib/reference.ts` (intentional small duplication to keep the Node build
  self-contained; `reference.ts` has no examples or ranks).

## Data model

Added to `lib/problems.ts` (and the generator output in
`reference_images/latex/problems.ts`):

```ts
export interface Hint {
  command: string; // what to TYPE, e.g. "\\varepsilon", "\\tilde{ }", "\\begin{cases}"
  name: string;    // friendly label, e.g. "var epsilon", "tilde accent", "cases (piecewise)"
  example: string; // renderable KaTeX snippet for a glyph preview, e.g. "\\tilde{x}"
}

export interface Problem {
  id: string;
  title: string;
  latex: string;
  difficulty: Difficulty;
  points: number;
  topic: string;
  hints: Hint[]; // ordered trickiest-first; may be empty
}
```

`example` is separate from `command` because some commands do not render alone
(`\tilde` errors; `\tilde{x}` renders as x̃). The preview glyph renders `example`
via the existing `KatexMath` component.

## Hint generation (build-time)

New module `reference_images/latex/hints-dictionary.mjs` exports a curated list of
~60 notable commands:

```js
// { token, command, name, example, rank }
{ token: "\\varepsilon", command: "\\varepsilon", name: "var epsilon", example: "\\varepsilon", rank: 30 }
{ token: "\\tilde",      command: "\\tilde{ }",    name: "tilde accent", example: "\\tilde{x}", rank: 20 }
{ token: "cases",        command: "\\begin{cases}", name: "cases (piecewise)", example: "\\begin{cases} a & x>0 \\\\ b & x\\le0 \\end{cases}", rank: 10, env: true }
```

`build-problems.mjs` gains a `hintsFor(latex)` step:

1. Tokenize the target: collect `\command` names (`/\\[a-zA-Z]+/g`) and
   environment names (`/\\begin\{([a-z]+)\*?\}/g`).
2. Look each up in the dictionary (environment entries matched by `env` name,
   command entries by token). Tokens absent from the dictionary produce no hint —
   the dictionary *is* the curation filter.
3. Dedupe by `command`, sort ascending by `rank` (lower = trickier = first),
   cap at 5.
4. Emit `hints: [...]` into each problem object.

Rank bands (lower shown first):
`10` environments · `20` accents · `30` var/rare Greek · `40` big operators
(`\sum \int \prod \lim \sqrt \binom`) · `50` relations/arrows
(`\implies \iff \succeq \in …`) · `60` fonts/text (`\mathbb \operatorname \text …`).

Regeneration flow is unchanged: `node build-problems.mjs` then copy
`reference_images/latex/problems.ts` → `lib/problems.ts`.

## UI (`components/Game.tsx`)

- New state: `hintsShown: number` (count revealed for the current problem),
  reset to `0` inside `advance()` and `playAgain()`.
- A **Hint** button in the existing control bar (left group, alongside
  "Skip This Problem" / "End Game"), styled like the other bordered buttons.
  - Label: `Show Hint` when none shown; `Next Hint (n/total)` while more remain;
    disabled reading `No more hints` when `hintsShown === hints.length`.
  - In Timed mode the label carries the cost: `Hint (−1 pt)` / `Next Hint (−1 pt, n/total)`.
  - Hidden entirely when `current.hints.length === 0`.
- Revealed hints render below the control bar (above `Target`) as a stacked list;
  each row: `command` in mono · a small `KatexMath` glyph of `example` · `name`.
- `onClick` increments `hintsShown` up to `hints.length`.

## Scoring

In `handleInput`, replace the flat award with an effective value:

```ts
const penalty = mode === "timed" ? hintsShown : 0;
const awarded = Math.max(1, current.points - penalty);
setScore((s) => s + awarded);
```

The success flash shows `+{awarded}` (compute once, reuse for flash text).

## Edge cases

- Zero detected commands → no Hint button, no hint list.
- All hints revealed → button disabled ("No more hints").
- Hints never reveal the answer — only the command vocabulary.
- A problem is always worth ≥ 1 point even after many hints.

## Testing / Definition of Done

1. `npm run build` passes (TypeScript sees `hints` on every problem).
2. Generator: a problem with `\begin{cases}` and `\varepsilon` yields those as
   the first hints, cases before var-epsilon (rank order).
3. Dev flow: Hint button reveals commands progressively; resets on next problem.
4. Timed mode: solving after 2 hints on an 8-pt problem awards 6; Zen awards 8.
5. No console errors on the game screen.

## Out of scope

- Structural/prose hints ("this is a piecewise function") — commands only.
- Editing individual problems' hints by hand (generation is automatic; manual
  override can be added later if needed).
- Multi-part composite problems.
