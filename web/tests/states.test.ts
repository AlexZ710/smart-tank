// S21/S22 data-state semantics tests (frozen: docs/Web_Facade_Architecture.md).
import test from "node:test";
import assert from "node:assert/strict";
import { STALE_AFTER_S, ageLabel, stateForValue } from "../lib/states.ts";

test("STALE_AFTER_S defaults to 180 (env-overridable)", () => {
  assert.equal(process.env.STALE_AFTER_S === undefined ? 180 : STALE_AFTER_S, 180);
});

test("null value -> MISSING (never zero, never blank-as-normal)", () => {
  assert.equal(stateForValue(null, 10), "MISSING");
  assert.equal(stateForValue(undefined, null), "MISSING");
});

test("optional channel (XKC) null -> OPTIONAL_ABSENT", () => {
  assert.equal(stateForValue(null, 10, { optional: true }), "OPTIONAL_ABSENT");
  assert.equal(stateForValue("0", 10, { optional: true }), "CURRENT"); // '0' is a real state, not absent
});

test("age boundary: <= STALE_AFTER_S is CURRENT, beyond is STALE", () => {
  assert.equal(stateForValue(25.4, 0), "CURRENT");
  assert.equal(stateForValue(25.4, 180), "CURRENT");
  assert.equal(stateForValue(25.4, 180.5), "STALE");
});

test("unknown age with a value -> MISSING (honest, not CURRENT)", () => {
  assert.equal(stateForValue(25.4, null), "MISSING");
  assert.equal(stateForValue(25.4, Number.NaN), "MISSING");
});

test("ageLabel formats honestly", () => {
  assert.equal(ageLabel(null), "age unknown");
  assert.equal(ageLabel(42), "42 s old");
  assert.equal(ageLabel(120), "2 min old");
  assert.equal(ageLabel(7200), "2.0 h old");
});
