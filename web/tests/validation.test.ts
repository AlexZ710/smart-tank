// S22 contract-validation tests. Run: npm test  (node --test tests/)
// Frozen reference: docs/Telemetry_Contract.md. These tests are the web-side
// twin of the Python clean_data range tests: same ranges, same reject-never-
// clamp, same forbidden-field policy.
import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_BATCH,
  findForbiddenKey,
  parseIngestPayload,
} from "../lib/validation.ts";

function reading(overrides: Record<string, unknown> = {}) {
  return {
    timestamp_ms: 183456789,
    temperature_c: 25.43,
    ph: 8.21,
    ph_voltage_v: 1.287,
    light_relative_pct: 42.5,
    light_voltage_v: 1.403,
    xkc_level_state: null,
    ...overrides,
  };
}

function payload(readings: unknown[] = [reading()], extra: Record<string, unknown> = {}) {
  return { device_id: "st-a1b2c3d4e5f6", readings, ...extra };
}

test("valid full payload accepted", () => {
  const r = parseIngestPayload(payload());
  assert.equal(r.status, 200);
  if (r.status !== 200) return;
  assert.equal(r.rows.length, 1);
  assert.equal(r.rejected.length, 0);
  assert.equal(r.rows[0].temperature_c, 25.43);
  assert.equal(r.rows[0].xkc_level_state, null);
});

test("ph_voltage_v validated but not stored (CSV-pipeline only)", () => {
  const ok = parseIngestPayload(payload([reading({ ph_voltage_v: 2.5 })]));
  assert.equal(ok.status, 200);
  const bad = parseIngestPayload(payload([reading({ ph_voltage_v: 5.1 })]));
  assert.equal(bad.status, 200);
  if (bad.status === 200) {
    assert.equal(bad.rows.length, 0);
    assert.match(bad.rejected[0].error, /ph_voltage_v=5.1 out of range 0..5/);
  }
});

test("xkc_level_state accepts 0, 1, null; rejects everything else", () => {
  for (const v of [0, 1, null]) {
    const r = parseIngestPayload(payload([reading({ xkc_level_state: v })]));
    assert.equal(r.status, 200);
    if (r.status === 200) assert.equal(r.rows.length, 1, `xkc=${String(v)} should be accepted`);
  }
  for (const v of [2, "1", false, true, "0"]) {
    const r = parseIngestPayload(payload([reading({ xkc_level_state: v })]));
    assert.equal(r.status, 200);
    if (r.status === 200) {
      assert.equal(r.rows.length, 0, `xkc=${JSON.stringify(v)} must be row-rejected`);
      assert.match(r.rejected[0].error, /xkc_level_state/);
    }
  }
});

test("missing channel key row-rejected - never defaulted to null", () => {
  const row = reading();
  delete (row as Record<string, unknown>).temperature_c;
  const r = parseIngestPayload(payload([row]));
  assert.equal(r.status, 200);
  if (r.status === 200) {
    assert.equal(r.rows.length, 0);
    assert.match(r.rejected[0].error, /temperature_c missing/);
  }
});

test("range boundaries inclusive; out-of-range row-rejected (never clamped)", () => {
  const cases: Array<[string, number, boolean]> = [
    ["temperature_c", -10, true],
    ["temperature_c", 85, true],
    ["temperature_c", -10.1, false],
    ["temperature_c", 85.1, false],
    ["ph", 0, true],
    ["ph", 14, true],
    ["ph", 14.1, false],
    ["ph", -0.1, false],
    ["light_relative_pct", 0, true],
    ["light_relative_pct", 100, true],
    ["light_relative_pct", 100.1, false],
    ["light_voltage_v", 5, true],
    ["light_voltage_v", 5.1, false],
  ];
  for (const [field, value, ok] of cases) {
    const r = parseIngestPayload(payload([reading({ [field]: value })]));
    assert.equal(r.status, 200);
    if (r.status !== 200) continue;
    if (ok) {
      assert.equal(r.rows.length, 1, `${field}=${value} should be accepted`);
    } else {
      assert.equal(r.rows.length, 0, `${field}=${value} should be rejected`);
      assert.match(r.rejected[0].error, /out of range/);
    }
  }
});

test("NaN/Infinity/string numbers row-rejected", () => {
  for (const v of [Number.NaN, Number.POSITIVE_INFINITY, "25.4"]) {
    const r = parseIngestPayload(payload([reading({ temperature_c: v })]));
    assert.equal(r.status, 200);
    if (r.status === 200) assert.equal(r.rows.length, 0);
  }
});

test("timestamp_ms must be integer > 0", () => {
  for (const v of [0, -5, 1.5, "100", null, undefined]) {
    const row = reading();
    if (v === undefined) delete (row as Record<string, unknown>).timestamp_ms;
    else (row as Record<string, unknown>).timestamp_ms = v;
    const r = parseIngestPayload(payload([row]));
    assert.equal(r.status, 200);
    if (r.status === 200) {
      assert.equal(r.rows.length, 0, `timestamp_ms=${JSON.stringify(v)} must be rejected`);
    }
  }
});

test("device_id rules: non-empty, <= 64 chars", () => {
  assert.equal(parseIngestPayload({ device_id: "", readings: [] }).status, 400);
  assert.equal(parseIngestPayload({ device_id: "   ", readings: [] }).status, 400);
  assert.equal(parseIngestPayload({ device_id: 42, readings: [] }).status, 400);
  assert.equal(parseIngestPayload(payload([], { device_id: "x".repeat(65) })).status, 400);
  assert.equal(parseIngestPayload(payload([], { device_id: "x".repeat(64) })).status, 200);
});

test("malformed payloads -> 400", () => {
  for (const body of [null, 42, "str", [], {}, { device_id: "d" }, { device_id: "d", readings: {} }]) {
    assert.equal(parseIngestPayload(body).status, 400, JSON.stringify(body));
  }
});

test("batch over 500 -> 413; exactly 500 -> 200", () => {
  assert.equal(parseIngestPayload(payload(Array.from({ length: MAX_BATCH + 1 }, () => reading()))).status, 413);
  assert.equal(parseIngestPayload(payload(Array.from({ length: MAX_BATCH }, () => reading()))).status, 200);
});

test("forbidden fields reject the WHOLE request with 400", () => {
  const forbiddenKeys = [
    "orp_mv", "conductivity_us", "ec", "ec_us_cm", "flow_lpm",
    "zp4510_state", "fs300a_flow", "float_state", "lux", "par_umol",
    "ppfd", "dosing_status", "salinity_sg", "ammonia_mg_l",
  ];
  for (const key of forbiddenKeys) {
    const r = parseIngestPayload(payload([reading({ [key]: 1 })]));
    assert.equal(r.status, 400, `reading key ${key} must 400`);
    const top = parseIngestPayload(payload([reading()], { [key]: 1 }));
    assert.equal(top.status, 400, `top-level key ${key} must 400`);
  }
  assert.equal(findForbiddenKey({ temperature_c: 25, received_at: 1, vector: 2, spec: "x", second: 1 }), null);
});

test("unknown extra fields ignored (forward compatibility)", () => {
  const r = parseIngestPayload(payload([reading({ future_sensor_x: 1, notes: "hi" })]));
  assert.equal(r.status, 200);
  if (r.status === 200) {
    assert.equal(r.rows.length, 1);
    assert.equal("future_sensor_x" in r.rows[0], false);
  }
});

test("partial success: per-row independence", () => {
  const r = parseIngestPayload(
    payload([reading(), reading({ ph: 99 }), reading(), reading({ timestamp_ms: 0 })]),
  );
  assert.equal(r.status, 200);
  if (r.status !== 200) return;
  assert.equal(r.rows.length, 2);
  assert.deepEqual(r.rejected.map((x) => x.index), [1, 3]);
});

test("firmware_version: optional, defaults to honest 'unknown' marker", () => {
  const r = parseIngestPayload(payload());
  assert.equal(r.status, 200);
  if (r.status === 200) assert.equal(r.rows[0].firmware_version, "unknown");
  const r2 = parseIngestPayload(payload([reading()], { firmware_version: "1.2.0-s23" }));
  if (r2.status === 200) assert.equal(r2.rows[0].firmware_version, "1.2.0-s23");
  const r3 = parseIngestPayload(payload([reading({ firmware_version: "" })]));
  if (r3.status === 200) {
    assert.equal(r3.rows.length, 0);
  }
});
