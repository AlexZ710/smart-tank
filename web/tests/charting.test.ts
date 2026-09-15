// S25 chart data-prep tests: gap segmentation must be purely subtractive on
// continuity (never invent points), and ticks must stay honest for flat data.
import test from "node:test";
import assert from "node:assert/strict";
import {
  GAP_BREAK_S,
  groupRowsByDevice,
  niceTicks,
  segmentByGaps,
  type SeriesPoint,
} from "../lib/charting.ts";

const pts = (ts: number[]): SeriesPoint[] => ts.map((t) => ({ t, v: 25 }));

test("GAP_BREAK_S aligns with the frozen staleness window (180 s)", () => {
  assert.equal(GAP_BREAK_S, 180);
});

test("dense consecutive samples stay one continuous segment", () => {
  const segs = segmentByGaps(pts([0, 1000, 2000, 3000]));
  assert.equal(segs.length, 1);
  assert.equal(segs[0].length, 4);
});

test("a gap beyond the threshold breaks the line; exactly-at-threshold stays connected", () => {
  const atThreshold = segmentByGaps(pts([0, GAP_BREAK_S * 1000]));
  assert.equal(atThreshold.length, 1, "gap == max must NOT break (> comparison)");
  const beyond = segmentByGaps(pts([0, GAP_BREAK_S * 1000 + 1]));
  assert.equal(beyond.length, 2, "gap > max must break");
});

test("segmentation never invents, drops or reorders points", () => {
  const input = pts([0, 1000, 500_000, 501_000, 1_200_000]);
  const segs = segmentByGaps(input);
  const flat = segs.flat();
  assert.deepEqual(flat, input, "concatenated segments must equal the input exactly");
  assert.equal(segs.length, 3);
});

test("edge cases: empty input and single point", () => {
  assert.deepEqual(segmentByGaps([]), []);
  const one = pts([42]);
  assert.deepEqual(segmentByGaps(one), [one]);
});

test("niceTicks: clean 1/2/5 steps inside the range", () => {
  const ticks = niceTicks(20, 30, 4);
  assert.ok(ticks.length >= 2);
  assert.ok(ticks[0] >= 20 && ticks[ticks.length - 1] <= 30);
  const step = ticks[1] - ticks[0];
  assert.ok([0.5, 1, 2, 2.5, 5, 10].some((s) => Math.abs(step - s) < 1e-9), `step ${step} should be clean`);
});

test("niceTicks: flat series yields a single tick - a range is never invented", () => {
  assert.deepEqual(niceTicks(8.2, 8.2), [8.2]);
});

test("niceTicks: non-finite input yields no ticks", () => {
  assert.deepEqual(niceTicks(Number.NaN, 10), []);
  assert.deepEqual(niceTicks(0, Number.POSITIVE_INFINITY), []);
});

test("groupRowsByDevice preserves first-seen device order and row order", () => {
  const rows = [
    { device_id: "b", n: 1 },
    { device_id: "a", n: 2 },
    { device_id: "b", n: 3 },
  ];
  const groups = groupRowsByDevice(rows);
  assert.deepEqual(groups.map((g) => g.device_id), ["b", "a"]);
  assert.deepEqual(groups[0].rows.map((r) => r.n), [1, 3]);
});
