import katex from "katex";

/**
 * Answer-checking for the typesetting game.
 *
 * Primary strategy — RENDERED COMPARISON (what TeXnique does):
 *   Render both the target and the player's input with KaTeX to MathML, strip the
 *   raw-source annotation KaTeX embeds, normalize whitespace, and compare. Because
 *   KaTeX's MathML output is deterministic and semantic, any two inputs that render
 *   to the same visual result compare equal — so `x^2` ≡ `x^{2}`, and in display
 *   mode `\frac` ≡ `\dfrac`, `\binom` ≡ `\dbinom`, etc. — while visually different
 *   formulas differ.
 *
 * Fallback — NORMALIZED SOURCE MATCH:
 *   A fast path that accepts trivially-equal source (whitespace / `\left`-`\right`
 *   sizing / single-token brace differences) even before rendering.
 *
 * Invalid input LaTeX never throws out of here — it returns `status: "error"` with
 * a readable message so the UI can show a render error instead of crashing.
 */

export type CheckStatus = "correct" | "incorrect" | "error";

export interface CheckResult {
  status: CheckStatus;
  /** Present only when status === "error": a readable KaTeX parse message. */
  message?: string;
}

const KATEX_OPTS = {
  displayMode: true,
  throwOnError: true,
  strict: false as const,
  output: "mathml" as const,
};

/**
 * Remove `<mstyle scriptlevel="0" displaystyle="true">` wrappers, innermost first.
 * In display mode the ambient style is already display, so this wrapper — which
 * `\dfrac`, `\dbinom`, `\displaystyle`, … emit — is a visual no-op and must not
 * make an answer count as different. Other `mstyle` variants (e.g. `\tfrac`'s
 * `displaystyle="false"`, which *is* visually smaller) are deliberately left intact.
 */
function stripRedundantDisplayStyle(mathml: string): string {
  const wrapper =
    /<mstyle scriptlevel="0" displaystyle="true">((?:(?!<\/?mstyle)[\s\S])*?)<\/mstyle>/;
  let out = mathml;
  let prev: string;
  do {
    prev = out;
    out = out.replace(wrapper, "$1");
  } while (out !== prev);
  return out;
}

/**
 * MathML elements whose content is an implied sequence ("inferred mrow"). An
 * `<mrow>` that is a direct child of one of these is pure, associative grouping
 * with no visual effect, so it can be flattened. Elements NOT in this set —
 * `mfrac`, `msup`, `msub`, `msubsup`, `mroot`, `munder`, `mover`, `munderover` —
 * take a fixed number of positional argument slots, where an `<mrow>` groups one
 * argument and MUST be preserved (it distinguishes `\frac{ab}{c}` from
 * `\frac{a}{bc}`, or `a^{bc}` from `{ab}^{c}`).
 */
const SEQUENCE_PARENTS = new Set([
  "math",
  "semantics",
  "mrow",
  "mstyle",
  "mpadded",
  "mphantom",
  "menclose",
  "merror",
  "msqrt",
  "#root",
]);

type MathMLNode =
  | string
  | { tag: string; attrs: string; selfClosing: boolean; children: MathMLNode[] };

/** Parse a (well-formed, KaTeX-produced) MathML/HTML fragment into a tag tree. */
function parseTags(html: string): MathMLNode[] {
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
  const root = { tag: "#root", attrs: "", selfClosing: false, children: [] as MathMLNode[] };
  const stack = [root];
  for (const tk of tokens) {
    if (tk.startsWith("</")) {
      if (stack.length > 1) stack.pop();
    } else if (tk.startsWith("<")) {
      const selfClosing = tk.endsWith("/>");
      const m = /^<([a-zA-Z][\w:-]*)([\s\S]*?)\/?>$/.exec(tk);
      if (!m) continue;
      const node = { tag: m[1], attrs: m[2], selfClosing, children: [] as MathMLNode[] };
      stack[stack.length - 1].children.push(node);
      if (!selfClosing) stack.push(node);
    } else {
      stack[stack.length - 1].children.push(tk);
    }
  }
  return root.children;
}

/** Serialize back to a string, flattening redundant `<mrow>` grouping as it goes. */
function serializeTags(nodes: MathMLNode[], parentTag: string): string {
  let out = "";
  for (const node of nodes) {
    if (typeof node === "string") {
      out += node;
      continue;
    }
    const inner = serializeTags(node.children, node.tag);
    if (node.tag === "mrow" && SEQUENCE_PARENTS.has(parentTag)) {
      out += inner; // redundant associative grouping — drop the mrow tags
    } else if (node.selfClosing) {
      out += `<${node.tag}${node.attrs}/>`;
    } else {
      out += `<${node.tag}${node.attrs}>${inner}</${node.tag}>`;
    }
  }
  return out;
}

/**
 * Canonicalize MathML by flattening only visually-redundant `<mrow>` grouping,
 * preserving mrows that fill an argument slot of a positional element. This makes
 * `{ab}c` ≡ `abc` and `\dbinom` ≡ `\binom`, while keeping `\frac{ab}{c}` distinct
 * from `\frac{a}{bc}`.
 */
function collapseRedundantMrows(mathml: string): string {
  return serializeTags(parseTags(mathml), "#root");
}

// Memoize normalized-MathML by source string. The live game calls checkAnswer on
// every keystroke, and the *target* is identical across all of them — this turns
// N re-renders of the unchanging target into one. Bounded so a long session can't
// grow it without limit.
const mathmlCache = new Map<string, string>();
const MATHML_CACHE_MAX = 512;

/** Render `latex` to MathML and reduce it to a canonical, comparable string. */
function toNormalizedMathML(latex: string): string {
  const cached = mathmlCache.get(latex);
  if (cached !== undefined) return cached;

  const rendered = katex.renderToString(latex, KATEX_OPTS);
  const collapsed = rendered
    // Drop the round-trippable TeX source KaTeX embeds — it differs between
    // equivalent inputs and would defeat the whole comparison.
    .replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, "")
    // Collapse insignificant whitespace FIRST so tag literals are canonical
    // before we match the redundant-display-style wrapper below.
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
  const result = collapseRedundantMrows(stripRedundantDisplayStyle(collapsed));

  if (mathmlCache.size >= MATHML_CACHE_MAX) mathmlCache.clear();
  mathmlCache.set(latex, result);
  return result;
}

/**
 * Light source normalization for the fast-path exact match. Includes a set of
 * common LaTeX alias equivalences ported from the original TeXnique's
 * `normalizations.js`, so answers written with an equivalent command are accepted
 * (e.g. `\implies` for `\Longrightarrow`, or `A|B` for `A\mid B`). These only add
 * acceptance on the fast path; they never reject.
 */
function normalizeSource(latex: string): string {
  return (
    latex
      // --- alias normalizations (mirrors TeXnique's normalizations.js) ---
      .replace(/\\not\s*\\in(?!\w)/g, "\\notin")
      .replace(/\\not\s*=/g, "\\neq")
      .replace(/\\mid(?!\w)/g, "|")
      .replace(/\\Longleftrightarrow(?!\w)/g, "\\iff")
      .replace(/\\Longrightarrow(?!\w)/g, "\\implies")
      // Backslash-space `\ ` (but not `\\`) is just a space.
      .replace(/(?<!\\)\\ /g, " ")
      // --- structural / whitespace normalization ---
      // Strip all whitespace (including the tie `~` and thin space handled below).
      .replace(/\s+/g, "")
      // Delimiter auto-sizing doesn't change the formula's identity.
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
      // `x^{2}` ≡ `x^2`, `a_{i}` ≡ `a_i` for single-token groups.
      .replace(/([_^])\{([a-zA-Z0-9])\}/g, "$1$2")
      // `\,` `\;` `\:` `\!` explicit spaces don't change identity for the fast path.
      .replace(/\\[,;:!]/g, "")
  );
}

/** Turn a thrown KaTeX ParseError into a short, user-facing message. */
function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  // KaTeX prefixes messages with "KaTeX parse error: " — keep it readable.
  return raw.replace(/^KaTeX parse error:\s*/, "").trim() || "Invalid LaTeX";
}

/**
 * Compare the player's `input` against the `target` formula.
 * Returns "correct" | "incorrect" | "error".
 */
export function checkAnswer(input: string, target: string): CheckResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { status: "incorrect" };
  }

  // Fast path: normalized source already matches.
  if (normalizeSource(input) === normalizeSource(target)) {
    return { status: "correct" };
  }

  // Primary: rendered (MathML) comparison. Only the INPUT can be malformed —
  // a bad input is an "error" (show the render message), not a wrong answer.
  let inputML: string;
  try {
    inputML = toNormalizedMathML(input);
  } catch (err) {
    return { status: "error", message: friendlyError(err) };
  }

  let targetML: string;
  try {
    targetML = toNormalizedMathML(target);
  } catch {
    // A malformed target is an authoring bug, not the player's fault; without a
    // trustworthy rendered target we can only fall back to the source check,
    // which already failed above.
    return { status: "incorrect" };
  }

  return { status: inputML === targetML ? "correct" : "incorrect" };
}

/**
 * True when `input` is a valid, correct answer for `target`. Convenience wrapper
 * for the live game loop, which auto-advances on a correct render.
 */
export function isCorrect(input: string, target: string): boolean {
  return checkAnswer(input, target).status === "correct";
}
