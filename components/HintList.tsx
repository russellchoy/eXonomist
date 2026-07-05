import type { Hint } from "@/lib/problems";
import { KatexMath } from "@/components/KatexMath";

/**
 * Renders the hints revealed so far for the current problem as a stacked list:
 * each row is the command to type (mono), a rendered glyph preview, and a
 * friendly name. Renders nothing until at least one hint is revealed.
 */
export function HintList({ hints, shown }: { hints: Hint[]; shown: number }) {
  const revealed = hints.slice(0, shown);
  if (revealed.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2 border-2 border-black bg-[var(--surface,#faf9f6)] p-4">
      {revealed.map((h, i) => (
        <li key={h.command} className="flex items-center gap-4">
          <span className="w-8 shrink-0 text-sm text-[var(--muted)] tabular-nums">
            {i + 1}.
          </span>
          <code className="min-w-0 shrink-0 font-mono text-base">{h.command}</code>
          <KatexMath
            latex={h.example}
            displayMode={false}
            className="shrink-0 text-lg"
          />
          <span className="text-base text-[var(--muted)]">{h.name}</span>
        </li>
      ))}
    </ul>
  );
}
