/*
 * Wordmarks for the game masthead.
 *
 * Brand: "Exonomist" — the "X" is typeset as a large chi (χ), a math-flavored pun.
 * The tagline keeps the classic stylized LaTeX logo. Pure presentational.
 */

export const BRAND = "eXonomist";

/** The "TeX" logo used inside the LaTeX mark: T, lowered/kerned E, X. */
function TeX() {
  return (
    <span className="whitespace-nowrap">
      T
      <span className="inline-block -ml-[0.16em] -mr-[0.05em] translate-y-[0.22em]">
        E
      </span>
      X
    </span>
  );
}

/** The classic "LaTeX" logo: L, small raised A, then TeX. */
export function LaTeX() {
  return (
    <span className="whitespace-nowrap">
      L
      <span className="inline-block text-[0.7em] -ml-[0.32em] -mr-[0.12em] -translate-y-[0.28em]">
        A
      </span>
      <TeX />
    </span>
  );
}

/** "eXonomist" wordmark: the X rendered as an oversized italic chi (χ). */
export function ExonomistLogo() {
  return (
    <span className="whitespace-nowrap">
      e
      <span
        className="inline-block font-serif text-[1.3em] italic leading-none"
        // χ — GREEK SMALL LETTER CHI, standing in for the "X"
        aria-hidden
      >
        χ
      </span>
      <span className="sr-only">X</span>
      onomist
    </span>
  );
}

/** The site masthead: brand wordmark above the "A LaTeX Typesetting Game" tagline. */
export function Masthead({ size = "large" }: { size?: "large" | "small" }) {
  const titleClass =
    size === "large" ? "text-6xl sm:text-7xl" : "text-4xl sm:text-5xl";
  const taglineClass =
    size === "large" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className={`${titleClass} font-normal tracking-tight`}>
        <ExonomistLogo />
      </h1>
      <p className={`${taglineClass} font-normal`}>
        a <LaTeX /> typesetting game for economists
      </p>
    </div>
  );
}
