// Curated "how to build a formula" cheat-sheet for the game — the most useful
// LaTeX commands, grouped, each with a renderable example and a plain-English
// description. Distinct from lib/reference.ts (which is a 200-glyph symbol
// lookup): this is about STRUCTURE — fractions, scripts, environments, accents.
// Shown on /glossary and in the in-game Glossary tab. All examples are KaTeX-safe.

export interface GlossaryEntry {
  command: string; // what to type (the pattern), e.g. String.raw`\frac{a}{b}`
  example: string; // a renderable KaTeX snippet for the glyph preview
  description: string; // one-line explanation
}

export interface GlossaryGroup {
  name: string;
  note?: string; // optional hint shown under the group heading
  entries: GlossaryEntry[];
}

export const glossary: GlossaryGroup[] = [
  {
    name: "Structure",
    note: "Braces { } group what a command applies to. Superscripts use ^, subscripts use _.",
    entries: [
      { command: String.raw`x^{2}`, example: String.raw`x^{2}`, description: "superscript / power" },
      { command: String.raw`x_{i}`, example: String.raw`x_{i}`, description: "subscript" },
      { command: String.raw`x_{i}^{2}`, example: String.raw`x_{i}^{2}`, description: "sub- and superscript together" },
      { command: String.raw`\frac{a}{b}`, example: String.raw`\frac{a}{b}`, description: "fraction" },
      { command: String.raw`\dfrac{a}{b}`, example: String.raw`\dfrac{a}{b}`, description: "bigger, display-style fraction" },
      { command: String.raw`\sqrt{x}`, example: String.raw`\sqrt{x}`, description: "square root" },
      { command: String.raw`\sqrt[n]{x}`, example: String.raw`\sqrt[n]{x}`, description: "nth root" },
      { command: String.raw`\sum_{i=1}^{n}`, example: String.raw`\sum_{i=1}^{n}`, description: "summation with limits" },
      { command: String.raw`\prod_{i=1}^{n}`, example: String.raw`\prod_{i=1}^{n}`, description: "product with limits" },
      { command: String.raw`\int_{a}^{b}`, example: String.raw`\int_{a}^{b}`, description: "integral with limits" },
      { command: String.raw`\lim_{x \to 0}`, example: String.raw`\lim_{x \to 0}`, description: "limit" },
      { command: String.raw`\binom{n}{k}`, example: String.raw`\binom{n}{k}`, description: "binomial coefficient" },
      { command: String.raw`\left( \right)`, example: String.raw`\left( \dfrac{a}{b} \right)`, description: "auto-sized delimiters (also [ ], \\{ \\}, | )" },
    ],
  },
  {
    name: "Multi-line environments",
    note: "Separate rows with \\\\ and columns with &.",
    entries: [
      { command: String.raw`\begin{cases} \end{cases}`, example: String.raw`\begin{cases} a & x>0 \\ b & x\le 0 \end{cases}`, description: "piecewise definition" },
      { command: String.raw`\begin{pmatrix} \end{pmatrix}`, example: String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`, description: "matrix in parentheses" },
      { command: String.raw`\begin{bmatrix} \end{bmatrix}`, example: String.raw`\begin{bmatrix} a & b \\ c & d \end{bmatrix}`, description: "matrix in square brackets" },
      { command: String.raw`\begin{vmatrix} \end{vmatrix}`, example: String.raw`\begin{vmatrix} a & b \\ c & d \end{vmatrix}`, description: "determinant (vertical bars)" },
      { command: String.raw`\begin{aligned} \end{aligned}`, example: String.raw`\begin{aligned} x &= a \\ y &= b \end{aligned}`, description: "align equations on & (e.g. the = sign)" },
    ],
  },
  {
    name: "Accents & decorations",
    entries: [
      { command: String.raw`\hat{x}`, example: String.raw`\hat{x}`, description: "hat (estimates)" },
      { command: String.raw`\bar{x}`, example: String.raw`\bar{x}`, description: "bar (means)" },
      { command: String.raw`\tilde{x}`, example: String.raw`\tilde{x}`, description: "tilde" },
      { command: String.raw`\vec{x}`, example: String.raw`\vec{x}`, description: "vector arrow" },
      { command: String.raw`\dot{x}`, example: String.raw`\dot{x}`, description: "dot (time derivative)" },
      { command: String.raw`\widehat{xy}`, example: String.raw`\widehat{xy}`, description: "wide hat over several symbols" },
      { command: String.raw`\overline{x}`, example: String.raw`\overline{x}`, description: "overline" },
      { command: String.raw`\underset{a}{b}`, example: String.raw`\underset{a}{b}`, description: "place a below b (e.g. std. errors)" },
    ],
  },
  {
    name: "Greek letters",
    note: "Capitalise the command for the uppercase form, e.g. \\Sigma. var-forms give the alternate glyph.",
    entries: [
      { command: String.raw`\alpha`, example: String.raw`\alpha`, description: "alpha" },
      { command: String.raw`\beta`, example: String.raw`\beta`, description: "beta" },
      { command: String.raw`\gamma`, example: String.raw`\gamma`, description: "gamma" },
      { command: String.raw`\delta`, example: String.raw`\delta`, description: "delta" },
      { command: String.raw`\theta`, example: String.raw`\theta`, description: "theta" },
      { command: String.raw`\lambda`, example: String.raw`\lambda`, description: "lambda" },
      { command: String.raw`\mu`, example: String.raw`\mu`, description: "mu (mean)" },
      { command: String.raw`\pi`, example: String.raw`\pi`, description: "pi (profit / constant)" },
      { command: String.raw`\rho`, example: String.raw`\rho`, description: "rho (correlation)" },
      { command: String.raw`\sigma`, example: String.raw`\sigma`, description: "sigma (std. deviation)" },
      { command: String.raw`\phi`, example: String.raw`\phi`, description: "phi" },
      { command: String.raw`\omega`, example: String.raw`\omega`, description: "omega" },
      { command: String.raw`\varepsilon`, example: String.raw`\varepsilon`, description: "var epsilon (the common one)" },
      { command: String.raw`\varphi`, example: String.raw`\varphi`, description: "var phi" },
      { command: String.raw`\Sigma`, example: String.raw`\Sigma`, description: "capital sigma" },
      { command: String.raw`\Omega`, example: String.raw`\Omega`, description: "capital omega" },
    ],
  },
  {
    name: "Relations & operators",
    entries: [
      { command: String.raw`\leq`, example: String.raw`\leq`, description: "less than or equal" },
      { command: String.raw`\geq`, example: String.raw`\geq`, description: "greater than or equal" },
      { command: String.raw`\neq`, example: String.raw`\neq`, description: "not equal" },
      { command: String.raw`\approx`, example: String.raw`\approx`, description: "approximately equal" },
      { command: String.raw`\equiv`, example: String.raw`\equiv`, description: "identical / defined as" },
      { command: String.raw`\sim`, example: String.raw`\sim`, description: "distributed as / similar" },
      { command: String.raw`\to`, example: String.raw`\to`, description: "arrow (tends to)" },
      { command: String.raw`\implies`, example: String.raw`\implies`, description: "implies" },
      { command: String.raw`\in`, example: String.raw`\in`, description: "element of" },
      { command: String.raw`\times`, example: String.raw`\times`, description: "multiplication cross" },
      { command: String.raw`\cdot`, example: String.raw`\cdot`, description: "centred dot (product)" },
      { command: String.raw`\pm`, example: String.raw`\pm`, description: "plus-minus" },
      { command: String.raw`\mathbb{E}`, example: String.raw`\mathbb{E}`, description: "blackboard bold (expectation, R, N)" },
      { command: String.raw`\mathrm{d}`, example: String.raw`\mathrm{d}`, description: "upright roman (e.g. the d in dx)" },
      { command: String.raw`\operatorname{Var}`, example: String.raw`\operatorname{Var}`, description: "named multi-letter operator" },
      { command: String.raw`\text{if}`, example: String.raw`x \text{ if } y`, description: "plain text inside math" },
    ],
  },
];
