// S22 rate-limiter unit tests (pure, deterministic: time is injected).
import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../lib/ratelimit.ts";

test("allows up to max within window, then blocks", () => {
  const rl = createRateLimiter({ windowMs: 60_000, max: 3 });
  assert.equal(rl.allow("ip1", 1000), true);
  assert.equal(rl.allow("ip1", 2000), true);
  assert.equal(rl.allow("ip1", 3000), true);
  assert.equal(rl.allow("ip1", 4000), false);
});

test("window slides: oldest hit expires", () => {
  const rl = createRateLimiter({ windowMs: 1000, max: 2 });
  assert.equal(rl.allow("k", 0), true);
  assert.equal(rl.allow("k", 500), true);
  assert.equal(rl.allow("k", 900), false);
  assert.equal(rl.allow("k", 1001), true); // t=0 expired
  assert.equal(rl.allow("k", 1400), false); // t=500 still in window
  assert.equal(rl.allow("k", 1501), true); // t=500 expired
});

test("keys are independent", () => {
  const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
  assert.equal(rl.allow("a", 0), true);
  assert.equal(rl.allow("a", 1), false);
  assert.equal(rl.allow("b", 1), true);
});

test("retryAfterS reports whole seconds until the window frees", () => {
  const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
  rl.allow("k", 0);
  assert.equal(rl.retryAfterS("k", 30_000), 30);
  assert.equal(rl.retryAfterS("k", 59_500), 1); // ceil, min 1
  assert.equal(rl.retryAfterS("k", 60_001), 0);
});

test("reset clears state", () => {
  const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
  assert.equal(rl.allow("k", 0), true);
  assert.equal(rl.allow("k", 1), false);
  rl.reset();
  assert.equal(rl.allow("k", 2), true);
});
