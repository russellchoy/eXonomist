import { problems } from "@/lib/problems";

// The daily challenge: DAILY_COUNT questions, chosen deterministically from the
// day's date so every player faces the SAME set. Lowest total time wins.
export const DAILY_COUNT = 8;

/**
 * Local calendar date as `YYYY-MM-DD`. This is the challenge key and the daily
 * leaderboard's partition — the board "resets" when this rolls over at midnight.
 */
export function dailyKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Deterministic PRNG (xmur3 seed → mulberry32) so a given date always yields the
// same questions, on every device, with no server round-trip.
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The DAILY_COUNT distinct problem indices for a given day — identical for
 * everyone who plays that date. Seeded Fisher–Yates over all problems.
 */
export function dailyIndices(
  key: string = dailyKey(),
  count = DAILY_COUNT,
): number[] {
  const rand = mulberry32(xmur3(`exonomist-daily-${key}`)());
  const pool = Array.from({ length: problems.length }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Format seconds as `m:ss` (or `h:mm:ss` past an hour) for display. */
export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
