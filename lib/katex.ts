import katex from "katex";

export interface RenderResult {
  ok: boolean;
  /** KaTeX HTML (safe to inject) when ok; empty string on error. */
  html: string;
  /** Readable parse message when !ok. */
  error?: string;
}

/**
 * Render LaTeX to KaTeX HTML without ever throwing. Invalid input yields
 * `{ ok: false, error }` so callers can show a render error instead of crashing.
 * Deterministic output means SSR and client markup match (no hydration warnings).
 */
export function safeRender(
  latex: string,
  { displayMode = true }: { displayMode?: boolean } = {},
): RenderResult {
  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: true,
      strict: false,
    });
    return { ok: true, html };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const error =
      raw.replace(/^KaTeX parse error:\s*/, "").trim() || "Invalid LaTeX";
    return { ok: false, html: "", error };
  }
}
