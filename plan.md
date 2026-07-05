# TeXnique-style LaTeX Typesetting Game — Build Plan

A clone of [texnique.xyz](https://texnique.xyz): players are shown a rendered
formula and must reproduce it in LaTeX. Live preview, timed + zen modes, scoring,
a searchable symbol reference table, and questions authored from lecture notes.

## Goals

1. Faithful TeXnique clone: Timed Game (3 min) and Zen Mode (untimed).
2. Questions authored in a single editable file, seeded from lecture notes.
3. Front-end reference table so players don't need Detexify.
4. Publishable to Vercel so friends can play via a URL.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **KaTeX** for math rendering (fast, same as TeXnique)
- Deploys to **Vercel** with zero config

Rationale: Next.js is the natural Vercel target and leaves room for future
server-side question generation without re-architecting.

## Architecture

```
texnique-clone/
  app/
    page.tsx            # landing: Timed / Zen buttons + hints
    play/page.tsx       # game screen (mode via query param)
    layout.tsx          # imports KaTeX CSS, global styles
  components/
    Game.tsx            # game loop: state, timer, score, skip
    LatexInput.tsx      # code editor textarea
    Preview.tsx         # live KaTeX render of the player's input
    Target.tsx          # renders the target formula
    ReferenceTable.tsx  # searchable symbol/notation cheatsheet
    Results.tsx         # end-of-game score screen
  lib/
    problems.ts         # <-- EDITABLE question file (author from notes here)
    checkAnswer.ts      # rendered-comparison + source-fallback logic
    reference.ts        # symbol data for the reference table
  ...config (next, tailwind, tsconfig, package.json)
```

## Feature details

### 1. Question authoring — `lib/problems.ts`

The one file to edit. Each entry:

```ts
{
  id: 'hockey-stick',
  title: 'Hockey-stick Identity',
  latex: String.raw`\sum_{i=r}^{n}\binom{i}{r}=\binom{n+1}{r+1}`,
  difficulty: 'medium',   // 'easy' | 'medium' | 'hard'
  points: 5,
  topic: 'Combinatorics',
}
```

- Paste equations straight from notes. `String.raw` avoids double-escaping backslashes.
- Points scale with difficulty (harder problems worth more).
- Structured so a parser/generator can populate this same array later without
  touching game code ("file now, generator later").

### 2. Answer checking — `lib/checkAnswer.ts`

**Primary: rendered comparison** (what TeXnique does). Render the target and the
player's input with KaTeX, normalize the output tree, compare. Accepts *any* LaTeX
that produces the same visual result (`\frac` vs `\dfrac`, `x^2` vs `x^{2}`, etc.).

**Fallback: normalized source match.** Strip whitespace and compare source strings
after light normalization — a fast path for exact matches.

Invalid LaTeX is handled gracefully: show a render error, never crash.

### 3. Reference table — `components/ReferenceTable.tsx`

Searchable, categorized cheatsheet: Greek letters, operators, big operators,
delimiters, accents, arrows, fractions/binomials, matrices/cases. Each row shows
the rendered symbol next to the command to type. A filter box finds `\lceil`
without leaving the page. Collapsible panel beside the editor.

### 4. Game modes

- **Timed**: 3-minute countdown, score race, "Skip This Problem", "End Game".
- **Zen**: untimed, infinite time.
- Live preview updates as the player types.
- Score weighted by difficulty. End screen shows problems solved + total score.

## Ship checklist

1. `npm install`
2. `npm run dev` — verify game loop, preview, checking, reference table.
3. `npm run build` — confirm it compiles clean.
4. `git init`, commit, push to a new GitHub repo.
5. Import the repo on Vercel (or `npx vercel`). Share the URL with friends.

## Open items / future

- Seed 5–10 real problems from lecture notes (hockey-stick included as sample).
- Optional: per-topic filtering, leaderboard, share-your-score.
- Optional later: build script to auto-parse equations from `.tex`/`.md` notes.
