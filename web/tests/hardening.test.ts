// S27 hardening tests: shared timing-safe token compare (used identically by
// ingestion and bounded-report generation) and the managed-Postgres SSL
// decision (TLS for every non-local DATABASE_URL, plain local dev by design).
import test from "node:test";
import assert from "node:assert/strict";
import { tokenMatches } from "../lib/auth.ts";
import { isLocalDatabaseUrl } from "../lib/db.ts";

test("tokenMatches: exact match accepted", () => {
  assert.equal(tokenMatches("s27-test-token", "s27-test-token"), true);
});

test("tokenMatches: wrong token rejected", () => {
  assert.equal(tokenMatches("wrong-token", "s27-test-token"), false);
});

test("tokenMatches: missing header rejected", () => {
  assert.equal(tokenMatches(null, "s27-test-token"), false);
});

test("tokenMatches: different-length token rejected (no throw)", () => {
  assert.equal(tokenMatches("short", "s27-test-token"), false);
  assert.equal(tokenMatches("s27-test-token-longer", "s27-test-token"), false);
});

test("isLocalDatabaseUrl: local hosts stay unencrypted by design", () => {
  assert.equal(isLocalDatabaseUrl("postgres://u:p@localhost:5432/smart_tank"), true);
  assert.equal(isLocalDatabaseUrl("postgresql://u:p@127.0.0.1:5432/smart_tank"), true);
  assert.equal(isLocalDatabaseUrl("postgres://u:p@[::1]:5432/db"), true);
  assert.equal(isLocalDatabaseUrl("postgres://localhost/db"), true);
});

test("isLocalDatabaseUrl: any remote/managed host requires TLS", () => {
  assert.equal(isLocalDatabaseUrl("postgres://u:p@ep-xyz.neon.tech/db"), false);
  assert.equal(isLocalDatabaseUrl("postgres://u:p@db.example.com:5432/db?sslmode=require"), false);
  assert.equal(isLocalDatabaseUrl("postgres://u:p@192.168.1.50:5432/db"), false);
  // "localhost" appearing elsewhere in the string must not fool the check
  assert.equal(isLocalDatabaseUrl("postgres://u:p@evil.com/localhost"), false);
});
