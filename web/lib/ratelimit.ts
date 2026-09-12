// S22: in-memory sliding-window rate limiter for POST /api/telemetry.
// LIMITATION (documented, not hidden): state is per server instance. The
// deployment target is a single-instance local/Vercel hobby setup; a
// multi-instance deployment needs a shared store before public demo (S27
// hardening checklist). Device cadence is 1 Hz with buffered batch flushes,
// so 120 requests/min per source is generous headroom, never a throttle
// on legitimate observation data.

export type RateLimiter = {
  allow(key: string, nowMs?: number): boolean;
  retryAfterS(key: string, nowMs?: number): number;
  reset(): void;
};

export function createRateLimiter(opts: { windowMs: number; max: number }): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(key: string, nowMs: number): number[] {
    const arr = (hits.get(key) ?? []).filter((t) => nowMs - t < opts.windowMs);
    hits.set(key, arr);
    return arr;
  }

  return {
    allow(key, nowMs = Date.now()) {
      const arr = prune(key, nowMs);
      if (arr.length >= opts.max) return false;
      arr.push(nowMs);
      return true;
    },
    retryAfterS(key, nowMs = Date.now()) {
      const arr = prune(key, nowMs);
      if (arr.length < opts.max) return 0;
      return Math.max(1, Math.ceil((arr[0] + opts.windowMs - nowMs) / 1000));
    },
    reset() {
      hits.clear();
    },
  };
}

export const ingestLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
