"use client";

import { useMemo, useState } from "react";
import { GAP_BREAK_S, niceTicks, segmentByGaps, type SeriesPoint } from "@/lib/charting";

// S25 time-series line chart - inline SVG, no chart library (deps stay pinned).
// Built to the dataviz spec: 2px round-join line in categorical slot-1 blue
// (validated >= 3:1 on both app surfaces), hairline SOLID gridlines, crosshair
// + tooltip on hover AND keyboard focus, one direct end-label in text ink,
// 8px end marker with a 2px surface ring, and a table-view twin.
//
// HONESTY: `points` are STORED readings (ascending). The line BREAKS wherever
// consecutive samples are more than GAP_BREAK_S apart - gaps are never
// interpolated, zero-filled or connected. A channel with no stored values in
// the range renders an honest empty note, not a flat zero line.

const W = 640;
const H = 240;
const M = { top: 14, right: 58, bottom: 26, left: 46 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

function fmtTime(ms: number, spanMs: number): string {
  const d = new Date(ms);
  return spanMs <= 48 * 3_600_000
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString([], { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fmtFull(ms: number): string {
  return new Date(ms).toLocaleString();
}

export default function TimeSeriesChart({
  title,
  unit,
  points,
  digits,
}: {
  title: string;
  unit: string;
  points: SeriesPoint[]; // ascending stored samples; nulls already excluded by the caller
  digits: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const geo = useMemo(() => {
    if (points.length === 0) return null;
    const segments = segmentByGaps(points);
    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    const vals = points.map((p) => p.v);
    let vMin = Math.min(...vals);
    let vMax = Math.max(...vals);
    if (vMin === vMax) {
      vMin -= 0.5;
      vMax += 0.5; // visual padding ONLY for the axis; ticks stay honest
    }
    const ticks = niceTicks(vMin, vMax, 4);
    const yLo = Math.min(vMin, ticks.length ? ticks[0] : vMin);
    const yHi = Math.max(vMax, ticks.length ? ticks[ticks.length - 1] : vMax);
    const x = (t: number) => (t1 === t0 ? M.left + PLOT_W / 2 : M.left + ((t - t0) / (t1 - t0)) * PLOT_W);
    const y = (v: number) => M.top + PLOT_H - ((v - yLo) / (yHi - yLo)) * PLOT_H;
    const xTicks = Array.from({ length: 5 }, (_, i) => t0 + ((t1 - t0) * i) / 4);
    return { segments, ticks, x, y, xTicks, spanMs: t1 - t0, last: points[points.length - 1] };
  }, [points]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!geo || points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    // crosshair finds the X: snap to the nearest STORED sample (never a guess between samples)
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(geo.x(points[i].t) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    setHoverIdx(best);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (points.length === 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setHoverIdx((i) => (i === null ? 0 : Math.min(points.length - 1, i + 1)));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setHoverIdx((i) => (i === null ? points.length - 1 : Math.max(0, i - 1)));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHoverIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHoverIdx(points.length - 1);
    } else if (e.key === "Escape") {
      setHoverIdx(null);
    }
  };

  const hover = hoverIdx !== null && geo ? points[hoverIdx] : null;
  const hoverXY = hover && geo ? { px: geo.x(hover.t), py: geo.y(hover.v) } : null;

  return (
    <div className="viz rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {title} <span className="font-normal opacity-60">({unit})</span>
        </h3>
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {showTable ? "Chart view" : "Table view"}
        </button>
      </div>

      {points.length === 0 ? (
        <p className="mt-3 text-sm opacity-60">
          No stored values in this range — nothing is plotted, interpolated or simulated.
        </p>
      ) : showTable ? (
        <div className="mt-3 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 opacity-60 dark:border-zinc-700">
                <th className="py-1 pr-3">received at</th>
                <th className="py-1 tabular-nums">
                  {title} ({unit})
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.t} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                  <td className="py-1 pr-3">{fmtFull(p.t)}</td>
                  <td className="py-1 tabular-nums">{p.v.toFixed(digits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        geo && (
          <div
            className="relative mt-2 outline-none"
            tabIndex={0}
            role="img"
            aria-label={`${title} line chart over the selected range; ${points.length} stored samples; use arrow keys to inspect points`}
            onKeyDown={onKey}
            onBlur={() => setHoverIdx(null)}
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
              {/* y gridlines + tick labels (hairline, solid, recessive) */}
              {geo.ticks.map((tv) => (
                <g key={tv}>
                  <line x1={M.left} x2={W - M.right} y1={geo.y(tv)} y2={geo.y(tv)} stroke="var(--viz-grid)" strokeWidth={1} />
                  <text
                    x={M.left - 6}
                    y={geo.y(tv) + 3}
                    textAnchor="end"
                    fontSize={10}
                    fill="var(--viz-muted)"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {tv}
                  </text>
                </g>
              ))}
              {/* baseline + x tick labels */}
              <line x1={M.left} x2={W - M.right} y1={M.top + PLOT_H} y2={M.top + PLOT_H} stroke="var(--viz-axis)" strokeWidth={1} />
              {geo.xTicks.map((t) => (
                <text key={t} x={geo.x(t)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--viz-muted)">
                  {fmtTime(t, geo.spanMs)}
                </text>
              ))}

              {/* data segments: one polyline per continuous run - breaks are gaps */}
              {geo.segments.map((seg, i) =>
                seg.length === 1 ? (
                  <circle key={i} cx={geo.x(seg[0].t)} cy={geo.y(seg[0].v)} r={4} fill="var(--viz-line)" stroke="var(--viz-surface)" strokeWidth={2} />
                ) : (
                  <polyline
                    key={i}
                    points={seg.map((p) => `${geo.x(p.t)},${geo.y(p.v)}`).join(" ")}
                    fill="none"
                    stroke="var(--viz-line)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ),
              )}

              {/* end marker (8px + 2px surface ring) and direct end-label in text ink */}
              <circle cx={geo.x(geo.last.t)} cy={geo.y(geo.last.v)} r={4} fill="var(--viz-line)" stroke="var(--viz-surface)" strokeWidth={2} />
              <text x={W - M.right + 6} y={geo.y(geo.last.v) + 3} fontSize={10} fill="currentColor" className="opacity-80">
                {geo.last.v.toFixed(digits)}
              </text>

              {/* crosshair + focus marker */}
              {hover && hoverXY && (
                <g>
                  <line x1={hoverXY.px} x2={hoverXY.px} y1={M.top} y2={M.top + PLOT_H} stroke="var(--viz-axis)" strokeWidth={1} />
                  <circle cx={hoverXY.px} cy={hoverXY.py} r={4.5} fill="var(--viz-line)" stroke="var(--viz-surface)" strokeWidth={2} />
                </g>
              )}

              {/* hit target: the whole plot area (bigger than any mark) */}
              <rect
                x={M.left}
                y={M.top}
                width={PLOT_W}
                height={PLOT_H}
                fill="transparent"
                onPointerMove={onMove}
                onPointerLeave={() => setHoverIdx(null)}
              />
            </svg>

            {/* tooltip: value leads, timestamp secondary, line key = short stroke */}
            {hover && hoverXY && (
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900/95"
                style={{
                  left: `${(hoverXY.px / W) * 100}%`,
                  top: `${(hoverXY.py / H) * 100}%`,
                  transform: `translate(${hoverXY.px > W * 0.6 ? "-90%" : "-10%"}, -115%)`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: "var(--viz-line)" }} />
                  <span className="font-semibold tabular-nums">
                    {hover.v.toFixed(digits)} {unit}
                  </span>
                </div>
                <div className="mt-0.5 opacity-60">{fmtFull(hover.t)}</div>
              </div>
            )}
          </div>
        )
      )}

      <p className="mt-2 text-[11px] opacity-50">
        Stored readings only — line breaks mark gaps &gt; {GAP_BREAK_S / 60} min; values are never
        interpolated. Hover or focus (arrow keys) for exact samples; table view lists every stored row.
      </p>
    </div>
  );
}
