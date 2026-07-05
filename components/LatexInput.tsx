"use client";

import type { ReactNode } from "react";

/**
 * The code editor: a black "terminal" textarea (see reference problem screens),
 * with the "Toggle Shadow" control beneath it. Auto-focuses on mount — the parent
 * gives it a `key` per problem so each new problem gets a fresh, focused editor.
 * `headerRight` renders on the label row (e.g. the Hint button) so it stays in
 * view with the editor.
 */
export function LatexInput({
  value,
  onChange,
  shadow,
  onToggleShadow,
  headerRight,
}: {
  value: string;
  onChange: (next: string) => void;
  shadow: boolean;
  onToggleShadow: (next: boolean) => void;
  headerRight?: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg">Edit your code here:</p>
        {headerRight}
      </div>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={4}
        placeholder="\sum_{i=r}^{n} \binom{i}{r}"
        aria-label="LaTeX code editor"
        className="code-editor w-full resize-y rounded-sm border-2 border-black p-4 text-lg leading-relaxed outline-none focus:border-[#3b5bdb]"
      />
      <label className="mt-3 inline-flex cursor-pointer select-none items-center gap-2 text-base">
        <input
          type="checkbox"
          checked={shadow}
          onChange={(e) => onToggleShadow(e.target.checked)}
          className="h-4 w-4 accent-black"
        />
        Toggle Shadow
      </label>
    </section>
  );
}
