import { safeRender } from "@/lib/katex";

/**
 * Render a LaTeX string with KaTeX. Never throws — invalid LaTeX renders as a
 * small red error message. Usable from both server and client components.
 */
export function KatexMath({
  latex,
  displayMode = true,
  className,
}: {
  latex: string;
  displayMode?: boolean;
  className?: string;
}) {
  const result = safeRender(latex, { displayMode });

  if (!result.ok) {
    return (
      <span className={`font-mono text-sm text-red-600 ${className ?? ""}`}>
        {result.error}
      </span>
    );
  }

  return (
    <span
      className={className}
      // KaTeX output is deterministic and self-contained; safe to inject.
      dangerouslySetInnerHTML={{ __html: result.html }}
    />
  );
}
