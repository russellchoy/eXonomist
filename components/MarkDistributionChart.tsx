"use client";

import { useMemo, useState } from "react";
import { ALL_TOPICS, summarize, type MarkStats, type MarkBucket } from "@/lib/stats";

// Grayscale fills — darkest = hard, matching the black-on-white aesthetic.
const FILL = { hard: "#111111", medium: "#777777", easy: "#cccccc" } as const;

// SVG geometry (viewBox units; scales responsively via width:100%).
const W = 640;
const H = 300;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 32;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export function MarkDistributionChart({ stats }: { stats: MarkStats }) {
  const [topic, setTopic] = useState<string>(ALL_TOPICS);

  const buckets: MarkBucket[] =
    topic === ALL_TOPICS ? stats.buckets : stats.byTopic[topic] ?? stats.buckets;

  const { total, mean, median, maxBucketTotal } = useMemo(
    () => summarize(buckets),
    [buckets],
  );

  const yMax = maxBucketTotal || 1; // guard divide-by-zero on empty scope
  const bandW = PLOT_W / buckets.length;
  const barW = bandW * 0.72;
  const yFor = (v: number) => PAD_T + PLOT_H - (v / yMax) * PLOT_H;

  // A few rounded y-axis gridlines.
  const yTicks = niceTicks(yMax, 4);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-lg">
          <span className="text-[var(--muted)]">Topic:</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="border-2 border-black bg-white px-2 py-1 text-base"
          >
            <option value={ALL_TOPICS}>{ALL_TOPICS}</option>
            {stats.topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <p className="text-base text-[var(--muted)]">
          {total} question{total === 1 ? "" : "s"} · mean {mean.toFixed(1)} · median{" "}
          {median}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Bar chart of question counts by mark (1 to 20) for ${topic}`}
      >
        {/* y gridlines + labels */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="#e5e5e5"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={yFor(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="#777777"
            >
              {t}
            </text>
          </g>
        ))}

        {/* baseline */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={yFor(0)}
          y2={yFor(0)}
          stroke="#000000"
          strokeWidth={1}
        />

        {/* bars: stacked hard (bottom) -> medium -> easy (top) */}
        {buckets.map((b, i) => {
          const x = PAD_L + i * bandW + (bandW - barW) / 2;
          const hardH = (b.hard / yMax) * PLOT_H;
          const medH = (b.medium / yMax) * PLOT_H;
          const easyH = (b.easy / yMax) * PLOT_H;
          const yHard = yFor(b.hard);
          const yMed = yFor(b.hard + b.medium);
          const yEasy = yFor(b.hard + b.medium + b.easy);
          const tip = `Mark ${b.mark}: ${b.total} (easy ${b.easy}, medium ${b.medium}, hard ${b.hard})`;
          return (
            <g key={b.mark}>
              <title>{tip}</title>
              {b.hard > 0 && (
                <rect x={x} y={yHard} width={barW} height={hardH} fill={FILL.hard} />
              )}
              {b.medium > 0 && (
                <rect x={x} y={yMed} width={barW} height={medH} fill={FILL.medium} />
              )}
              {b.easy > 0 && (
                <rect x={x} y={yEasy} width={barW} height={easyH} fill={FILL.easy} />
              )}
              {/* x label: show every mark (1..20) */}
              <text
                x={x + barW / 2}
                y={H - PAD_B + 14}
                textAnchor="middle"
                fontSize={11}
                fill="#555555"
              >
                {b.mark}
              </text>
            </g>
          );
        })}

        {/* x axis title */}
        <text
          x={PAD_L + PLOT_W / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={12}
          fill="#000000"
        >
          Mark
        </text>
      </svg>

      {/* legend */}
      <div className="flex items-center gap-5 text-base text-[var(--muted)]">
        <LegendSwatch color={FILL.easy} label="Easy" />
        <LegendSwatch color={FILL.medium} label="Medium" />
        <LegendSwatch color={FILL.hard} label="Hard" />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-3 w-3 border border-black/20"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

/** Rounded, evenly-spaced axis ticks from 0 up to >= yMax (excludes 0 label). */
function niceTicks(yMax: number, count: number): number[] {
  if (yMax <= 0) return [];
  const rawStep = yMax / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = niceNorm * mag;
  const ticks: number[] = [];
  for (let v = step; v <= yMax + 1e-9; v += step) ticks.push(Math.round(v));
  return [...new Set(ticks)];
}
