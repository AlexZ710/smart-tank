// S26 events tests: the queryable vocabulary must be EXACTLY the frozen S11
// rule codes (TEMP_*/PH_* only) - anything else (absent-sensor codes) is
// rejected, so forbidden events can never be queried or rendered.
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EVENTS_LIMIT,
  MAX_EVENTS_LIMIT,
  RULE_CODES,
  SEVERITIES,
  isValidRuleCode,
  isValidSeverity,
} from "../lib/events.ts";

test("vocabulary is exactly the eight frozen S11 codes", () => {
  assert.deepEqual([...RULE_CODES], [
    "TEMP_MISSING",
    "TEMP_INVALID",
    "TEMP_OUT_OF_RANGE",
    "TEMP_CRITICAL",
    "PH_MISSING",
    "PH_INVALID",
    "PH_OUT_OF_RANGE",
    "PH_CRITICAL",
  ]);
  assert.equal(RULE_CODES.length, 8);
  for (const c of RULE_CODES) {
    assert.match(c, /^(TEMP|PH)_/); // measured baseline channels only
  }
});

test("severities are exactly warning|critical", () => {
  assert.deepEqual([...SEVERITIES], ["warning", "critical"]);
});

test("limits follow the frozen contract (default 200, cap 1000)", () => {
  assert.equal(DEFAULT_EVENTS_LIMIT, 200);
  assert.equal(MAX_EVENTS_LIMIT, 1000);
});

test("isValidRuleCode accepts every frozen code", () => {
  for (const c of RULE_CODES) assert.equal(isValidRuleCode(c), true);
});

test("isValidRuleCode rejects absent-sensor and invented codes", () => {
  for (const bad of [
    "ORP_HIGH", // should reject: forbidden absent-sensor code
    "ORP_LOW", // should reject
    "EC_OUT_OF_RANGE", // should reject
    "CONDUCTIVITY_HIGH", // should reject
    "FLOW_STUCK", // should reject
    "FLOW_MISSING", // should reject
    "FLOAT_SWITCH_TRIGGERED", // should reject
    "ZP4510_WET", // should reject
    "FS300A_NO_FLOW", // should reject
    "SALINITY_HIGH", // should reject: manual-only, never a device event
    "AMMONIA_HIGH", // should reject
    "temp_missing", // should reject: case-sensitive
    "TEMP_",
    "",
  ]) {
    assert.equal(isValidRuleCode(bad), false, `should reject ${bad}`);
  }
});

test("isValidSeverity accepts only warning|critical", () => {
  assert.equal(isValidSeverity("warning"), true);
  assert.equal(isValidSeverity("critical"), true);
  for (const bad of ["info", "error", "WARNING", "", "alert"]) {
    assert.equal(isValidSeverity(bad), false, `should reject ${bad}`);
  }
});
