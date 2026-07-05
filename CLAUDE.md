# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A TeXnique-style LaTeX typesetting game. Players see a rendered formula and
reproduce it in LaTeX with a live preview. Timed + Zen modes, scoring, a
searchable symbol reference table, and questions authored from lecture notes.

**Branding:** the app is called **eXonomist** — in the masthead the "X" is
typeset as a large chi (χ), and the tagline reads "a LaTeX typesetting game for
economists". TeXnique remains the *visual/layout* reference only. The wordmark
lives in `components/Wordmark.tsx` (`BRAND` + `ExonomistLogo`).

Read `plan.md` in this folder for the full design brief. Follow it.

## Visual reference

`reference_images/` contains screenshots of the original TeXnique for UI/layout
reference — match this look and feel:

- `reference_images/landing.png` — landing page: title, "A LaTeX Typesetting Game"
  tagline, **Timed Game** / **Zen Mode** buttons, and a **Hints** list.
- `reference_images/problem1.png` — game screen (Hockey-stick Identity, 5 pts):
  "Skip This Problem" / "End Game" buttons, Score and Time in the header, the
  problem title + points, the target formula panel ("Try to create the following
  formula"), the live output panel ("This is what your output looks like"), and
  the black code editor ("Edit your code here") with a "Toggle Shadow" option.
- `reference_images/problem2.png` — game screen for the **Root Mean Square** sample
  (8 pts): `f_{\mathrm{rms}}=\sqrt{\frac{1}{T_2-T_1}\int_{T_1}^{T_2}[f(t)]^2\,dt}`.
- `reference_images/problem3.png` — game screen for the **Definition of a
  Well-founded Relation** sample (10 pts).
- `reference_images/problem4.png` — game screen for the **Euler's Theorem** sample
  (6 pts): `\gcd(a,n)=1 \implies a^{\varphi(n)}\equiv 1 \pmod{n}`.

The four `problemN.png` shots are the visual source of truth for the seeded
samples in `lib/problems.ts` — preserve their exact notation and point values.

Keep the clean, serif, black-on-white aesthetic of the original.

## Stack

- Next.js 16 (App Router) + TypeScript + React 19
- Tailwind CSS v4 (CSS-based config in `app/globals.css`, no `tailwind.config`)
- KaTeX for math rendering
- Target deploy: Vercel

> **Next.js 16 note:** this Next.js is newer than most training data. Consult
> `node_modules/next/dist/docs/` before writing app code. Key gotcha already
> handled: a client component calling `useSearchParams` **fails the production
> build** unless wrapped in a `<Suspense>` boundary — `/play` avoids this by
> reading `searchParams` (a Promise in Next 16) in the server page instead.

## Getting started (first run)

If the project is not scaffolded yet, initialize it in-place:

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir
npm install katex
npm install -D @types/katex
```

Then build out the structure described in `plan.md`.

> **This machine has no system Node/npm.** A self-contained Node v22 + npm
> toolchain lives under `~/.local/node` with symlinks in `~/.local/bin` (already
> on `PATH`). If a shell can't find `npm`, run `export PATH="$HOME/.local/bin:$PATH"`
> first.

## Commands

```bash
npm run dev     # local dev server (use this to iterate)
npm run build   # production build — must pass before pushing
npm run lint    # eslint
npm start       # run the production build locally
npm run import  # regenerate lib/problems.ts from questions.txt (validates KaTeX)
```

## Project structure

```
questions.txt   # SOURCE OF TRUTH for questions — edit this, then `npm run import`
app/            # routes: / (landing), /play (game)
components/      # Game, LatexInput, Preview, Target, ReferenceTable, Results, Wordmark, KatexMath
lib/
  problems.ts   # GENERATED from questions.txt — do not hand-edit
  checkAnswer.ts# answer-checking logic
  reference.ts  # symbol data for the reference table
  katex.ts      # safe KaTeX render helper
scripts/
  import-questions.mjs  # parses questions.txt, validates, regenerates problems.ts
```

## Repo folder index (running state)

Keep this current as the build progresses — it's the at-a-glance map of what
exists in the repo right now.

| Path | Status | What's there |
|------|--------|--------------|
| `CLAUDE.md` | ✅ | This guidance file. |
| `plan.md` | ✅ | Full design brief. |
| `questions.txt` | ✅ | **Question source of truth** — edit here, then `npm run import`. |
| `reference_images/` | 📌 | `landing.png` + `problem1–4.png` UI reference shots. **Gitignored** — kept locally, not in the repo. |
| `scripts/` | ✅ | `import-questions.mjs` — the question importer. |
| `app/` | ✅ | `layout.tsx` (imports KaTeX CSS), `globals.css`, `page.tsx` (landing), `play/page.tsx` (game). |
| `components/` | ✅ | `Game`, `LatexInput`, `Preview`, `Target`, `ReferenceTable`, `Results`, `Wordmark`, `KatexMath`. |
| `lib/` | ✅ | `problems.ts` (GENERATED), `checkAnswer.ts`, `reference.ts`, `katex.ts`. |
| `package.json` etc. | ✅ | Next.js 16 + Tailwind v4 + KaTeX config from `create-next-app`. |

Legend: ✅ present · 🔧 in progress this build.

## Key conventions

- **KaTeX, not MathJax.** Render in display style. Import `katex/dist/katex.min.css`
  in `app/layout.tsx`.
- **Answer checking**: rendered comparison is primary (render both target and input
  with KaTeX, normalize, compare), normalized-source match is the fallback. Never
  crash on invalid LaTeX — show a render error.
- **Questions are authored in `questions.txt`**, then compiled into
  `lib/problems.ts` with `npm run import`. `problems.ts` is GENERATED — never
  hand-edit it (the importer overwrites it). Each block:
  `@ Title | difficulty | topic | points(optional)` followed by raw LaTeX (no `$`).
  The importer renders every formula and refuses to write if any fails, so a typo
  can't reach the game. The `Problem` shape (`id`, `title`, `latex`, `difficulty`,
  `points`, `topic`) stays stable; `id` is auto-slugged from the title.
- **No `$` delimiters** in stored LaTeX — the renderer wraps formulas itself
  (mirrors TeXnique: "No `$` signs needed").
- Points scale with difficulty; harder problems are worth more.
- TypeScript strict mode. Prefer server components; mark interactive pieces
  (`Game`, `LatexInput`, `Preview`) with `"use client"`.

## Definition of done for a change

1. `npm run build` passes.
2. `npm run dev` — the affected flow works (target renders, preview updates,
   checking accepts a correct answer and rejects a wrong one).
3. No console errors on the game screen.

## Deploy

Push to GitHub, import on Vercel (zero config for Next.js), or `npx vercel`.
Do not commit `.env` secrets; none are needed for the base game.

## Notes for the user's context

The question bank is seeded from the user's lecture notes. Author in `questions.txt`
(one `@ Title | difficulty | topic | points` block + raw LaTeX per question), then
run `npm run import`. Preserve exact notation from the source; set difficulty/points
sensibly (harder identities = more points). The hockey-stick sample, as it appears
in `questions.txt`:

```
@ Hockey-stick Identity | medium | Combinatorics | 5
\sum_{i=r}^{n}\binom{i}{r}=\binom{n+1}{r+1}
```
