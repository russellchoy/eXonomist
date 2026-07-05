import { glossary } from "@/lib/glossary";
import { KatexMath } from "@/components/KatexMath";

/**
 * The glossary cheat-sheet: grouped rows of rendered example · command · what it
 * does. Presentational and stateless — used full-height on /glossary and inside
 * the collapsible in-game Glossary tab (GlossaryPanel).
 */
export function GlossaryTable() {
  return (
    <div className="flex flex-col gap-6">
      {glossary.map((group) => (
        <div key={group.name}>
          <h3 className="mb-1 border-b border-[var(--muted)] pb-1 text-base font-bold">
            {group.name}
          </h3>
          {group.note && (
            <p className="mb-2 text-sm text-[var(--muted)]">{group.note}</p>
          )}
          <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            {group.entries.map((e) => (
              <li
                key={group.name + e.command}
                className="flex items-center gap-3 border-b border-dotted border-gray-200 py-1.5"
              >
                <KatexMath
                  latex={e.example}
                  displayMode={false}
                  className="w-16 shrink-0 text-base"
                />
                <code className="w-40 shrink-0 truncate font-mono text-xs text-[var(--muted)]">
                  {e.command}
                </code>
                <span className="min-w-0 text-sm">{e.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
