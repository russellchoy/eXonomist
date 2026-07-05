import { NextResponse, type NextRequest } from "next/server";

// Server-side proxy to the Google Apps Script web app that backs the leaderboard
// (see docs/leaderboard-setup.md). Proxying keeps the sheet URL server-side,
// sidesteps browser CORS, and lets us validate before writing. If the env var is
// unset the endpoints degrade to `configured: false` so the app still runs.
const WEBAPP_URL = process.env.SHEET_WEBAPP_URL;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME = 24;

// Per-IP rate limiting. In-memory, so on serverless it's per-instance — coarse,
// but enough to stop a single client flooding the sheet and burning through the
// Apps Script daily quota. Writes are rare (one per finished game), so the
// budgets can be tight.
const WINDOW_MS = 60_000;
const MAX_POSTS_PER_WINDOW = 5;
const MAX_GETS_PER_WINDOW = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now >= entry.resetAt) {
    if (hits.size > 5_000) hits.clear(); // bound memory under address churn
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function cleanName(raw: unknown): string {
  const stripped = String(raw ?? "")
    .split("")
    .filter((ch) => ch.charCodeAt(0) >= 0x20) // drop control chars / newlines
    .join("")
    .trim()
    .slice(0, MAX_NAME);
  return stripped || "Anonymous";
}

// Board reads change at most once per finished game, so a few seconds of shared
// (CDN) caching blunts read floods without anyone noticing staleness.
const GET_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
};

export async function GET(req: NextRequest) {
  if (!WEBAPP_URL) return NextResponse.json({ configured: false, entries: [] });

  if (rateLimited(`get:${clientIp(req)}`, MAX_GETS_PER_WINDOW))
    return NextResponse.json({ configured: true, entries: [], error: "rate limited" }, { status: 429 });

  const board = req.nextUrl.searchParams.get("board") === "daily" ? "daily" : "timed";
  const date = req.nextUrl.searchParams.get("date") ?? "";

  const qs = new URLSearchParams({ board });
  if (board === "daily" && DATE_RE.test(date)) qs.set("date", date);

  try {
    const res = await fetch(`${WEBAPP_URL}?${qs.toString()}`, { cache: "no-store" });
    const data = await res.json();
    const entries = Array.isArray(data) ? data : (data?.entries ?? []);
    return NextResponse.json({ configured: true, entries }, { headers: GET_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ configured: true, entries: [], error: "fetch failed" });
  }
}

export async function POST(req: NextRequest) {
  if (!WEBAPP_URL) return NextResponse.json({ ok: false, configured: false });

  if (rateLimited(`post:${clientIp(req)}`, MAX_POSTS_PER_WINDOW))
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const board = body.board === "daily" ? "daily" : body.board === "timed" ? "timed" : null;
  if (!board) return NextResponse.json({ ok: false, error: "bad board" }, { status: 400 });

  const payload: Record<string, unknown> = { board, name: cleanName(body.name) };

  if (board === "timed") {
    const points = Number(body.points);
    if (!Number.isFinite(points) || points < 0 || points > 1_000_000)
      return NextResponse.json({ ok: false, error: "bad points" }, { status: 400 });
    payload.points = Math.round(points);
  } else {
    const seconds = Number(body.seconds);
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 1_000_000)
      return NextResponse.json({ ok: false, error: "bad seconds" }, { status: 400 });
    const date = String(body.date ?? "");
    if (!DATE_RE.test(date))
      return NextResponse.json({ ok: false, error: "bad date" }, { status: 400 });
    payload.seconds = Math.round(seconds);
    payload.date = date;
  }

  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: true, configured: true, duplicate: !!data?.duplicate });
  } catch {
    return NextResponse.json({ ok: false, configured: true, error: "write failed" }, { status: 502 });
  }
}
