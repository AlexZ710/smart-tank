// S24 ingestion-statistics tests (honest counters behind /system).
import test from "node:test";
import assert from "node:assert/strict";
import { createIngestStats } from "../lib/ingestStats.ts";

test("fresh stats are all zero with no timestamps", () => {
  const s = createIngestStats(() => 1_700_000_000_000).snapshot();
  assert.equal(s.requests, 0);
  assert.equal(s.rows_accepted, 0);
  assert.equal(s.rows_rejected, 0);
  assert.deepEqual(s.by_status, {});
  assert.deepEqual(s.errors_by_reason, {});
  assert.equal(s.last_accepted_at, null);
  assert.equal(s.last_error_at, null);
});

test("accepted request counts status 200, rows and last_accepted_at", () => {
  const t = 1_700_000_000_000;
  const stats = createIngestStats(() => t);
  stats.record({ status: 200, accepted: 10, rejectedRows: 1 });
  const s = stats.snapshot();
  assert.equal(s.requests, 1);
  assert.equal(s.by_status["200"], 1);
  assert.equal(s.rows_accepted, 10);
  assert.equal(s.rows_rejected, 1);
  assert.equal(s.last_accepted_at, new Date(t).toISOString());
  assert.equal(s.last_error_at, null);
});

test("errors count by status and reason, set last_error_at only", () => {
  const t = 1_700_000_005_000;
  const stats = createIngestStats(() => t);
  stats.record({ status: 401, reason: "unauthorized" });
  stats.record({ status: 401, reason: "unauthorized" });
  stats.record({ status: 400, reason: "contract_violation" });
  stats.record({ status: 503, reason: "database_unavailable" });
  const s = stats.snapshot();
  assert.equal(s.requests, 4);
  assert.equal(s.by_status["401"], 2);
  assert.equal(s.by_status["400"], 1);
  assert.equal(s.by_status["503"], 1);
  assert.equal(s.errors_by_reason["unauthorized"], 2);
  assert.equal(s.errors_by_reason["contract_violation"], 1);
  assert.equal(s.errors_by_reason["database_unavailable"], 1);
  assert.equal(s.last_error_at, new Date(t).toISOString());
  assert.equal(s.last_accepted_at, null);
});

test("error without explicit reason falls back to http_<status> key", () => {
  const stats = createIngestStats(() => 0);
  stats.record({ status: 429 });
  assert.equal(stats.snapshot().errors_by_reason["http_429"], 1);
});

test("snapshot is a copy - external mutation cannot corrupt counters", () => {
  const stats = createIngestStats(() => 0);
  stats.record({ status: 200, accepted: 1 });
  const s = stats.snapshot();
  s.by_status["200"] = 999;
  s.rows_accepted = 999;
  assert.equal(stats.snapshot().by_status["200"], 1);
  assert.equal(stats.snapshot().rows_accepted, 1);
});

test("reset clears everything back to the fresh state", () => {
  const stats = createIngestStats(() => 0);
  stats.record({ status: 200, accepted: 5 });
  stats.record({ status: 400 });
  stats.reset();
  const s = stats.snapshot();
  assert.equal(s.requests, 0);
  assert.equal(s.rows_accepted, 0);
  assert.deepEqual(s.by_status, {});
  assert.deepEqual(s.errors_by_reason, {});
  assert.equal(s.last_accepted_at, null);
  assert.equal(s.last_error_at, null);
});
