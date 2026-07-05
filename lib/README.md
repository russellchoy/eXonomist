# `lib/` — data & logic

Pure TypeScript, no React. This is the "brain" of the game.

| File | What it is | Edit it? |
|------|-----------|----------|
| `problems.ts` | The question bank. | **No — generated.** See below. |
| `reference.ts` | Symbols for the searchable cheatsheet. | Yes, by hand. |
| `checkAnswer.ts` | Decides if an answer matches the target. | Rarely. |
| `katex.ts` | Safe "render this LaTeX" helper. | Rarely. |

---

## Adding / editing questions

**Do not edit `problems.ts` directly** — it is regenerated and your changes would
be overwritten. It carries this banner:

```ts
// AUTO-GENERATED from questions.txt by `npm run import` — DO NOT EDIT BY HAND.
```

Instead, edit **`questions.txt`** in the repo root, then run:

```bash
npm run import
```

### The format

One block per question:

```
@ Title | difficulty | topic | points
<LaTeX on the next line(s) — raw, no $ signs>
```

- **Title** — required. Shown as “Problem N: <Title>”. Becomes the `id` (auto-slugged).
- **difficulty** — `easy` | `medium` | `hard`. Optional (default `medium`).
- **topic** — free text, e.g. `Microeconomics`. Optional (default `General`).
- **points** — integer. Optional; defaults by difficulty: **easy 3 · medium 5 · hard 8**.

Only the Title and its formula are mandatory; everything after the title is optional
and positional (separated by `|`).

### Rules

1. Write LaTeX **raw**, exactly as in your notes — `\alpha`, not `\\alpha`.
2. **No `$` delimiters** — the game wraps formulas itself.
3. Only [KaTeX-supported commands](https://katex.org/docs/supported.html) render.
4. Multi-line formulas (matrices, `cases`) are fine — put them on the lines after
   the header; use `\\` for row breaks and `&` for columns.
5. Lines starting with `#` are comments; blank lines are ignored.

### Examples

```
@ Cobb–Douglas Production Function | medium | Microeconomics
Y = A K^{\alpha} L^{1-\alpha}

@ Inverse of a 2x2 Matrix | medium | Linear Algebra | 6
\begin{pmatrix}a&b\\c&d\end{pmatrix}^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}

@ Signum Function | medium | Analysis
\operatorname{sgn}(x)=\begin{cases}-1&x<0\\0&x=0\\1&x>0\end{cases}
```

### What `npm run import` does

It parses `questions.txt`, **renders every formula through KaTeX**, and regenerates
`problems.ts`. If any formula fails (typo, unsupported command, unbalanced braces,
stray `$`) it **aborts and writes nothing**, telling you the exact line:

```
✗ Import aborted — 1 problem needs fixing:
  • questions.txt:42: "My Formula" does not render — Undefined control sequence: \alfa
lib/problems.ts was NOT changed.
```

Fix the line and re-run. On success it prints a per-difficulty count. Then
`npm run dev` to see the new questions in rotation.

---

## The `Problem` shape

`problems.ts` exports this (kept stable so tooling can generate it):

```ts
export interface Problem {
  id: string;         // kebab-case, unique — auto-slugged from the title
  title: string;
  latex: string;      // KaTeX-renderable, no $ delimiters
  difficulty: "easy" | "medium" | "hard";
  points: number;
  topic: string;
}
```

## Answer checking (how a match is decided)

`checkAnswer.ts` renders both the target and the player's input to KaTeX **MathML**,
canonicalizes it (drops the source annotation, redundant display-style wrappers, and
redundant `mrow` grouping), and compares. This accepts visually-identical LaTeX
(`x^2` ≡ `x^{2}`, `\dfrac` ≡ `\frac`, `{ab}c` ≡ `abc`) while rejecting genuinely
different formulas (`\frac{ab}{c}` ≠ `\frac{a}{bc}`). A normalized-source fast path
handles trivial matches first. Invalid input never throws — it returns an error the
UI shows as a red render message.
