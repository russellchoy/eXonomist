// Client helpers for the leaderboard, talking to our own /api/leaderboard route
// (which proxies a Google Sheet — see docs/leaderboard-setup.md). Every response
// carries `configured`: false when the backend env var isn't set, so the UI can
// show a friendly "not set up yet" state instead of failing.

export type Board = "timed" | "daily";

export interface TimedEntry {
  name: string;
  points: number;
  at: number; // ms timestamp
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  name: string;
  seconds: number;
  at: number;
}

export interface BoardResponse<E> {
  configured: boolean;
  entries: E[];
}

export interface SubmitResult {
  ok: boolean;
  configured: boolean;
  duplicate?: boolean; // daily: name already submitted for that date
}

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function fetchTimed(): Promise<BoardResponse<TimedEntry>> {
  const res = await fetch("/api/leaderboard?board=timed", { cache: "no-store" });
  return json(res);
}

export async function fetchDaily(date: string): Promise<BoardResponse<DailyEntry>> {
  const res = await fetch(
    `/api/leaderboard?board=daily&date=${encodeURIComponent(date)}`,
    { cache: "no-store" },
  );
  return json(res);
}

export async function submitTimed(
  name: string,
  points: number,
): Promise<SubmitResult> {
  const res = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board: "timed", name, points }),
  });
  return json(res);
}

export async function submitDaily(
  name: string,
  seconds: number,
  date: string,
): Promise<SubmitResult> {
  const res = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board: "daily", name, seconds, date }),
  });
  return json(res);
}
