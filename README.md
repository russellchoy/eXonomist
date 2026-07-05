# eXonomist

A TeXnique-style LaTeX typesetting game — *a LaTeX typesetting game for economists*.
You're shown a rendered formula and race to reproduce it in LaTeX, with a live
preview. Timed and Zen modes, difficulty-weighted scoring, and a searchable symbol
reference.

Built with **Next.js 16 · React 19 · Tailwind CSS v4 · KaTeX**. Deploys to Vercel
with zero config.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Other commands:

```bash
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
npm run import   # rebuild the question bank from questions.txt
```

## Adding questions

Questions are authored in **[`questions.txt`](questions.txt)**, then compiled into
`lib/problems.ts`:

```
@ Cobb–Douglas Production Function | medium | Microeconomics
Y = A K^{\alpha} L^{1-\alpha}
```

Run `npm run import` — it renders every formula through KaTeX and refuses to write
if any fails, so a typo can't reach the game. Full format guide in
[`lib/README.md`](lib/README.md).

## How it works

- `app/` — routes: `/` (landing) and `/play` (game).
- `components/` — the UI: `Game` (state, timer, scoring), the target/preview/editor
  panels, the searchable `ReferenceTable`, and the results screen.
- `lib/` — logic: `checkAnswer` compares answers by normalizing KaTeX **MathML**
  (accepts visually-equal LaTeX like `x^2` ≡ `x^{2}` and `\dfrac` ≡ `\frac`, rejects
  genuinely different formulas), plus the generated `problems.ts` and the symbol data.

## Deploy

Import the repo at [vercel.com/new](https://vercel.com/new) (auto-detects Next.js),
or run `npx vercel`. No environment variables are needed.
