// S25: pure data-prep helpers for the history charts. No rendering here.
//
// HONESTY CONTRACT (frozen): charts plot STORED rows only. A gap between
// consecutive stored samples is rendered as a line BREAK - samples are never
// interpolated, zero-filled, averaged or invented. segmentByGaps() is purely
// subtractive on continuity: the concatenation of its output segments equals
// its input exactly (same points, same order, no additions).

export type SeriesPoint = { t: number; v: number }; // epoch ms (server received_at), stored value

/**
 * Gaps longer than this render as visible breaks. Aligned with the frozen
 * STALE_AFTER_S semantics (web/lib/states.ts): a channel silent for longer
 * than the staleness window is not "continuous data" and must not be drawn
 * as one line.
 */
export const GAP_BREAK_S = 180;

/**
 * Split an ascending time series into continuous segments. A new segment
 * starts wherever the time between consecutive STORED samples exceeds
 * maxGapMs. Never creates, removes or modifies points.
 */
export function segmentByGaps(
  points: readonly SeriesPoint[],
  maxGapMs: number = GAP_BREAK_S * 1000,
): SeriesPoint[][] {
  const segments: SeriesPoint[][] = [];
  let current: SeriesPoint[] = [];
  for (const p of points) {
    if (current.length > 0 && p.t - current[current.length - 1].t > maxGapMs) {
      segments.push(current);
      current = [];
    }
    current.push(p);
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

/**
 * "Nice" axis ticks (1/2/5 x 10^k steps) covering [min, max].
 * A flat series yields a single tick at its value - a range is never
 * invented around it.
 */
export function niceTicks(min: number, max: number, target = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) return [min];
  const span = max - min;
  const rawStep = span / Math.max(1, target);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

/** Group history rows by device, preserving first-seen order and row order. */
export function groupRowsByDevice<T extends { device_id: string }>(
  rows: readonly T[],
): { device_id: string; rows: T[] }[] {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const r of rows) {
    let bucket = map.get(r.device_id);
    if (!bucket) {
      bucket = [];
      map.set(r.device_id, bucket);
      order.push(r.device_id);
    }
    bucket.push(r);
  }
  return order.map((device_id) => ({ device_id, rows: map.get(device_id) as T[] }));
}
