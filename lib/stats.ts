import type { Problem, Difficulty } from "@/lib/problems";

export const MIN_MARK = 1;
export const MAX_MARK = 20;
export const ALL_TOPICS = "All topics";

/** Per-mark counts split by difficulty. buckets[0] => mark 1 … buckets[19] => mark 20. */
export interface MarkBucket {
  mark: number; // 1..20
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export interface MarkStats {
  buckets: MarkBucket[]; // always length 20 (marks 1..20), zeros included
  topics: string[]; // distinct topics, sorted, derived from data
  byTopic: Record<string, MarkBucket[]>; // topic -> its own 20-bucket histogram
  total: number; // problem count (All topics scope)
  mean: number; // mean mark (All topics scope)
  median: number; // median mark (All topics scope)
  maxBucketTotal: number; // tallest bar (All topics scope)
}

function emptyBuckets(): MarkBucket[] {
  return Array.from({ length: MAX_MARK }, (_, i) => ({
    mark: i + 1,
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
  }));
}

function add(buckets: MarkBucket[], mark: number, difficulty: Difficulty): void {
  if (mark < MIN_MARK || mark > MAX_MARK) return; // defensive: formula already clamps
  const b = buckets[mark - MIN_MARK];
  b[difficulty] += 1;
  b.total += 1;
}

/** Summary numbers derived from a single scope's buckets. Safe on all-zero input. */
export function summarize(buckets: MarkBucket[]): {
  total: number;
  mean: number;
  median: number;
  maxBucketTotal: number;
} {
  let total = 0;
  let weighted = 0;
  let maxBucketTotal = 0;
  for (const b of buckets) {
    total += b.total;
    weighted += b.total * b.mark;
    if (b.total > maxBucketTotal) maxBucketTotal = b.total;
  }
  const mean = total === 0 ? 0 : weighted / total;

  // Median mark: walk cumulative counts to the middle item.
  let median = 0;
  if (total > 0) {
    const mid = (total + 1) / 2;
    let cum = 0;
    for (const b of buckets) {
      cum += b.total;
      if (cum >= mid) {
        median = b.mark;
        break;
      }
    }
  }
  return { total, mean, median, maxBucketTotal };
}

export function buildMarkStats(problems: Problem[]): MarkStats {
  const buckets = emptyBuckets();
  const byTopic: Record<string, MarkBucket[]> = {};

  for (const p of problems) {
    add(buckets, p.points, p.difficulty);
    if (!byTopic[p.topic]) byTopic[p.topic] = emptyBuckets();
    add(byTopic[p.topic], p.points, p.difficulty);
  }

  const topics = Object.keys(byTopic).sort((a, b) => a.localeCompare(b));
  const { total, mean, median, maxBucketTotal } = summarize(buckets);

  return { buckets, topics, byTopic, total, mean, median, maxBucketTotal };
}
