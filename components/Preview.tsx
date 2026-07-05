"use client";

import { safeRender } from "@/lib/katex";

/**
 * The live output panel: "This is what your output looks like:" above a bordered
 * box showing the player's input rendered with KaTeX. Invalid LaTeX shows a render
 * error (never crashes). When `shadow` is on, the target formula is overlaid faintly
 * behind the output so the player can line their attempt up against the goal.
 */
export function Preview({
  latex,
  shadowLatex,
  shadow,
}: {
  latex: string;
  shadowLatex: string;
  shadow: boolean;
}) {
  const trimmed = latex.trim();
  const result = trimmed ? safeRender(trimmed, { displayMode: true }) : null;
  const shadowResult = shadow
    ? safeRender(shadowLatex, { displayMode: true })
    : null;

  return (
    <section>
      <p className="mb-2 text-lg">This is what your output looks like:</p>
      <div className="relative flex min-h-[7rem] items-center justify-center overflow-x-auto border-2 border-black px-6 py-8">
        {shadowResult?.ok && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15"
            dangerouslySetInnerHTML={{ __html: shadowResult.html }}
          />
        )}

        {!trimmed && (
          <span className="text-base text-[var(--muted)]">
            Start typing below…
          </span>
        )}

        {result && result.ok && (
          <span
            className="relative text-xl"
            dangerouslySetInnerHTML={{ __html: result.html }}
          />
        )}

        {result && !result.ok && (
          <span className="relative font-mono text-sm text-red-600">
            {result.error}
          </span>
        )}
      </div>
    </section>
  );
}
