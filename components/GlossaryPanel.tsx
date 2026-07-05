"use client";

import { useState } from "react";
import { GlossaryTable } from "@/components/GlossaryTable";

/**
 * Collapsible in-game Glossary tab (sits under the hints). Closed by default so
 * it stays out of the way; mirrors the Symbol Reference toggle pattern.
 */
export function GlossaryPanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="border-2 border-black">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-lg font-bold"
      >
        <span>Glossary — useful LaTeX commands</span>
        <span className="font-mono text-base">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="max-h-[28rem] overflow-y-auto border-t-2 border-black p-4">
          <GlossaryTable />
        </div>
      )}
    </section>
  );
}
