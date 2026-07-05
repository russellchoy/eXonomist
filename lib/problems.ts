// AUTO-GENERATED from questions.txt by `npm run import` — DO NOT EDIT BY HAND.
// Add or change questions in questions.txt, then run:  npm run import
export type Difficulty = "easy" | "medium" | "hard";

export interface Problem {
  id: string;
  title: string;
  latex: string;
  difficulty: Difficulty;
  points: number;
  topic: string;
}

export const problems: Problem[] = [
  {
    id: "hockey-stick-identity",
    title: "Hockey-stick Identity",
    latex: String.raw`\sum_{i=r}^{n}\binom{i}{r}=\binom{n+1}{r+1}`,
    difficulty: "medium",
    points: 5,
    topic: "Combinatorics",
  },
  {
    id: "root-mean-square",
    title: "Root Mean Square",
    latex: String.raw`f_{\mathrm{rms}}=\sqrt{\frac{1}{T_2-T_1}\int_{T_1}^{T_2}[f(t)]^2\,dt}`,
    difficulty: "hard",
    points: 8,
    topic: "Signal Analysis",
  },
  {
    id: "definition-of-a-well-founded-relation",
    title: "Definition of a Well-founded Relation",
    latex: String.raw`(\forall S\subseteq X)[S\neq\emptyset\implies(\exists m\in S)(\forall s\in S)\neg(sRm)]`,
    difficulty: "hard",
    points: 10,
    topic: "Logic",
  },
  {
    id: "euler-s-theorem",
    title: "Euler's Theorem",
    latex: String.raw`\gcd(a,n)=1\implies a^{\varphi(n)}\equiv 1\pmod{n}`,
    difficulty: "medium",
    points: 6,
    topic: "Number Theory",
  },
  {
    id: "pythagorean-theorem",
    title: "Pythagorean Theorem",
    latex: String.raw`a^2+b^2=c^2`,
    difficulty: "easy",
    points: 3,
    topic: "Geometry",
  },
  {
    id: "quadratic-formula",
    title: "Quadratic Formula",
    latex: String.raw`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`,
    difficulty: "easy",
    points: 3,
    topic: "Algebra",
  },
  {
    id: "euler-s-identity",
    title: "Euler's Identity",
    latex: String.raw`e^{i\pi}+1=0`,
    difficulty: "easy",
    points: 3,
    topic: "Analysis",
  },
  {
    id: "power-rule-for-derivatives",
    title: "Power Rule for Derivatives",
    latex: String.raw`\frac{d}{dx}x^n=nx^{n-1}`,
    difficulty: "easy",
    points: 3,
    topic: "Calculus",
  },
  {
    id: "de-morgan-s-law",
    title: "De Morgan's Law",
    latex: String.raw`\overline{A\cup B}=\overline{A}\cap\overline{B}`,
    difficulty: "easy",
    points: 3,
    topic: "Logic",
  },
  {
    id: "binomial-theorem",
    title: "Binomial Theorem",
    latex: String.raw`(x+y)^n=\sum_{k=0}^{n}\binom{n}{k}x^{n-k}y^{k}`,
    difficulty: "medium",
    points: 5,
    topic: "Combinatorics",
  },
  {
    id: "geometric-series-sum",
    title: "Geometric Series Sum",
    latex: String.raw`\sum_{n=0}^{\infty}ar^{n}=\frac{a}{1-r},\quad |r|<1`,
    difficulty: "medium",
    points: 5,
    topic: "Analysis",
  },
  {
    id: "derivative-as-a-limit",
    title: "Derivative as a Limit",
    latex: String.raw`f'(x)=\lim_{h\to 0}\frac{f(x+h)-f(x)}{h}`,
    difficulty: "medium",
    points: 6,
    topic: "Calculus",
  },
  {
    id: "bayes-theorem",
    title: "Bayes' Theorem",
    latex: String.raw`P(A\mid B)=\frac{P(B\mid A)\,P(A)}{P(B)}`,
    difficulty: "medium",
    points: 5,
    topic: "Probability",
  },
  {
    id: "inverse-of-a-2x2-matrix",
    title: "Inverse of a 2x2 Matrix",
    latex: String.raw`\begin{pmatrix}a&b\\c&d\end{pmatrix}^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}`,
    difficulty: "medium",
    points: 6,
    topic: "Linear Algebra",
  },
  {
    id: "signum-function",
    title: "Signum Function",
    latex: String.raw`\operatorname{sgn}(x)=\begin{cases}-1&x<0\\0&x=0\\1&x>0\end{cases}`,
    difficulty: "medium",
    points: 5,
    topic: "Analysis",
  },
  {
    id: "gaussian-integral",
    title: "Gaussian Integral",
    latex: String.raw`\int_{-\infty}^{\infty}e^{-x^2}\,dx=\sqrt{\pi}`,
    difficulty: "hard",
    points: 8,
    topic: "Analysis",
  },
  {
    id: "cauchy-schwarz-inequality",
    title: "Cauchy-Schwarz Inequality",
    latex: String.raw`\left(\sum_{i=1}^{n}a_i b_i\right)^{2}\le\left(\sum_{i=1}^{n}a_i^{2}\right)\left(\sum_{i=1}^{n}b_i^{2}\right)`,
    difficulty: "hard",
    points: 9,
    topic: "Linear Algebra",
  },
  {
    id: "fourier-transform",
    title: "Fourier Transform",
    latex: String.raw`\hat{f}(\xi)=\int_{-\infty}^{\infty}f(x)\,e^{-2\pi i x\xi}\,dx`,
    difficulty: "hard",
    points: 10,
    topic: "Analysis",
  },
];
