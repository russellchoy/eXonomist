"use client";

import { useMemo, useState } from "react";
import { reference } from "@/lib/reference";
import { KatexMath } from "@/components/KatexMath";

/**
 * A searchable, categorized symbol cheatsheet so players don't need Detexify.
 * Each row shows the rendered glyph next to the command to type; the filter box
 * matches on command text or name. Collapsible so it stays out of the way.
 */
export function ReferenceTable() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return reference;
    return reference
      .map((cat) => ({
        ...cat,
        entries: cat.entries.filter(
          (e) =>
            e.command.toLowerCase().includes(q) ||
            e.name?.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.entries.length > 0);
  }, [q]);

  const total = useMemo(
    () => filtered.reduce((n, c) => n + c.entries.length, 0),
    [filtered],
  );

  return (
    <section className="border-2 border-black">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-lg font-bold"
      >
        <span>Symbol Reference</span>
        <span className="font-mono text-base">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t-2 border-black p-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter symbols…  e.g. \lceil, alpha, integral"
            aria-label="Filter symbols"
            className="mb-4 w-full rounded-sm border border-black px-3 py-2 font-mono text-sm outline-none focus:border-[#3b5bdb]"
          />

          {q && (
            <p className="mb-3 text-sm text-[var(--muted)]">
              {total} match{total === 1 ? "" : "es"}
            </p>
          )}

          <div className="max-h-[28rem] overflow-y-auto pr-1">
            {filtered.map((cat) => (
              <div key={cat.name} className="mb-5 last:mb-0">
                <h3 className="mb-2 border-b border-[var(--muted)] pb-1 text-base font-bold">
                  {cat.name}
                </h3>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                  {cat.entries.map((e) => (
                    <li
                      key={cat.name + e.command}
                      className="flex items-center justify-between gap-2 border-b border-dotted border-gray-200 py-1"
                    >
                      <KatexMath
                        latex={e.command}
                        displayMode={false}
                        className="shrink-0 text-base"
                      />
                      <code className="truncate text-right text-xs text-[var(--muted)]">
                        {e.command}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-sm text-[var(--muted)]">
                No symbols match “{query}”.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
