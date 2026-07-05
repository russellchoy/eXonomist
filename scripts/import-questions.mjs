#!/usr/bin/env node
/*
 * Question importer for eXonomist.
 *
 *   npm run import
 *
 * Reads ../questions.txt (the human-editable source of truth), validates that
 * EVERY formula renders under KaTeX, and regenerates ../lib/problems.ts. If any
 * formula fails to render, nothing is written and the offending entries are
 * listed — so a typo can never reach the game.
 *
 * questions.txt block format:
 *
 *     @ Title | difficulty | topic | points(optional)
 *     <LaTeX, raw, no $ — one or more lines until the next "@">
 *
 * Comments start with "#". Blank lines are ignored.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import katex from "katex";

const ROOT = new URL("../", import.meta.url);
const SRC = fileURLToPath(new URL("questions.txt", ROOT));
const OUT = fileURLToPath(new URL("lib/problems.ts", ROOT));

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const DEFAULT_POINTS = { easy: 3, medium: 5, hard: 8 };

/** title -> "kebab-case-id", de-duplicated across the whole set. */
function slugify(title, used) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "problem";
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

/** Parse questions.txt into raw {header, latex, line} blocks. */
function parseBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = null;
  lines.forEach((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    if (line.trimStart().startsWith("#")) return; // comment
    if (line.startsWith("@")) {
      if (current) blocks.push(current);
      current = { header: line.slice(1).trim(), latexLines: [], line: i + 1 };
    } else if (line.trim() === "") {
      // blank line — ignored (does not end a block; the next "@" does)
    } else if (current) {
      current.latexLines.push(line);
    } else {
      throw new Error(
        `questions.txt:${i + 1}: formula line before any "@ Title" header:\n  ${line}`,
      );
    }
  });
  if (current) blocks.push(current);
  return blocks;
}

/** Turn a raw block into a validated Problem, or collect an error. */
function toProblem(block, usedIds, errors) {
  const [titleRaw, diffRaw, topicRaw, pointsRaw] = block.header
    .split("|")
    .map((s) => s.trim());

  const title = titleRaw;
  if (!title) {
    errors.push(`questions.txt:${block.line}: missing title in header`);
    return null;
  }

  const difficulty = (diffRaw || "medium").toLowerCase();
  if (!DIFFICULTIES.has(difficulty)) {
    errors.push(
      `questions.txt:${block.line}: "${title}" has invalid difficulty "${diffRaw}" (use easy|medium|hard)`,
    );
    return null;
  }

  const topic = topicRaw || "General";
  const points = pointsRaw ? Number(pointsRaw) : DEFAULT_POINTS[difficulty];
  if (!Number.isFinite(points) || points <= 0) {
    errors.push(`questions.txt:${block.line}: "${title}" has invalid points "${pointsRaw}"`);
    return null;
  }

  const latex = block.latexLines.join("\n").trim();
  if (!latex) {
    errors.push(`questions.txt:${block.line}: "${title}" has no formula`);
    return null;
  }
  if (latex.includes("$")) {
    errors.push(`questions.txt:${block.line}: "${title}" contains a "$" — remove it (the renderer wraps formulas itself)`);
    return null;
  }

  // The critical check: does it actually render?
  try {
    katex.renderToString(latex, {
      throwOnError: true,
      displayMode: true,
      strict: false,
    });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).replace(
      /^KaTeX parse error:\s*/,
      "",
    );
    errors.push(`questions.txt:${block.line}: "${title}" does not render — ${msg}`);
    return null;
  }

  return {
    id: slugify(title, usedIds),
    title,
    latex,
    difficulty,
    points,
    topic,
  };
}

/** Emit a JS string literal: String.raw when safe, else a quoted string. */
function latexLiteral(latex) {
  // String.raw`...` breaks if the content has a backtick or "${".
  if (latex.includes("`") || latex.includes("${")) {
    return JSON.stringify(latex);
  }
  return "String.raw`" + latex + "`";
}

function render(problems) {
  const body = problems
    .map(
      (p) =>
        `  {\n` +
        `    id: ${JSON.stringify(p.id)},\n` +
        `    title: ${JSON.stringify(p.title)},\n` +
        `    latex: ${latexLiteral(p.latex)},\n` +
        `    difficulty: ${JSON.stringify(p.difficulty)},\n` +
        `    points: ${p.points},\n` +
        `    topic: ${JSON.stringify(p.topic)},\n` +
        `  },`,
    )
    .join("\n");

  return `// AUTO-GENERATED from questions.txt by \`npm run import\` — DO NOT EDIT BY HAND.
// Add or change questions in questions.txt, then run:  npm run import
export type Difficulty = "easy" | "medium" | "hard";

export interface Problem {
  id: string;
  title: string;
  latex: string;
  difficulty: Difficulty;
  points: number;
  topic: string;
}

export const problems: Problem[] = [
${body}
];
`;
}

function main() {
  let text;
  try {
    text = readFileSync(SRC, "utf8");
  } catch {
    console.error(`Could not read ${SRC}. Create a questions.txt first.`);
    process.exit(1);
  }

  const errors = [];
  const usedIds = new Set();
  const blocks = parseBlocks(text);
  const problems = blocks
    .map((b) => toProblem(b, usedIds, errors))
    .filter(Boolean);

  if (errors.length > 0) {
    console.error(`\n✗ Import aborted — ${errors.length} problem(s) need fixing:\n`);
    for (const e of errors) console.error("  • " + e);
    console.error("\nlib/problems.ts was NOT changed.\n");
    process.exit(1);
  }

  if (problems.length === 0) {
    console.error("No questions found in questions.txt. Nothing written.");
    process.exit(1);
  }

  writeFileSync(OUT, render(problems), "utf8");

  const byDiff = { easy: 0, medium: 0, hard: 0 };
  for (const p of problems) byDiff[p.difficulty]++;
  console.log(`\n✓ Imported ${problems.length} questions → lib/problems.ts`);
  console.log(`  easy: ${byDiff.easy}   medium: ${byDiff.medium}   hard: ${byDiff.hard}`);
  console.log(`  All formulas render under KaTeX. Run \`npm run dev\` to play.\n`);
}

main();
