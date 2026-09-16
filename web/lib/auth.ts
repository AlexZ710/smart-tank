// S27: shared Bearer-token auth helpers (extracted from the S22 telemetry
// route so ingestion and bounded-report generation enforce token handling
// IDENTICALLY). Timing-safe comparison only; tokens come from server-side
// env and are never logged, echoed in responses, or bundled for the client.
import type { NextRequest } from "next/server"; // type-only: erased at runtime so this module stays testable under plain node --test
import { timingSafeEqual } from "node:crypto";

export function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m ? m[1].trim() : null;
}

export function tokenMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
