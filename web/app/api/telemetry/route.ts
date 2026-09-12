import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { ingestLimiter } from "@/lib/ratelimit";
import { scrubError } from "@/lib/scrub";
import { parseIngestPayload } from "@/lib/validation";

// S22: POST /api/telemetry per the FROZEN docs/Telemetry_Contract.md.
//  - Bearer DEVICE_INGEST_TOKEN (timing-safe compare); 401 missing/wrong.
//  - 503 when the server itself has no token configured (never silently open).
//  - Rate limited per source: 429 with retry_after_s.
//  - Forbidden field anywhere -> 400 (whole request).
//  - Batch > 500 -> 413. Per-row validation independent -> 200
//    {"accepted": n, "rejected": [{index, error}]} (partial success).
//  - null stored as NULL (never defaulted); server assigns recorded_at /
//    received_at; device timestamp_ms stored as sent.
//  - Database unreachable -> 503 honest error, never a fake acceptance.

export const dynamic = "force-dynamic";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m ? m[1].trim() : null;
}

function tokenMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = process.env.DEVICE_INGEST_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "ingestion not configured: DEVICE_INGEST_TOKEN missing on server" },
      { status: 503 },
    );
  }
  if (!tokenMatches(bearerToken(req), expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const source = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!ingestLimiter.allow(source)) {
    return Response.json(
      { error: "rate limited", retry_after_s: ingestLimiter.retryAfterS(source) },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "malformed JSON body" }, { status: 400 });
  }

  // parseIngestPayload is total: it never throws, it returns a status.
  const parsed = parseIngestPayload(body);
  if (parsed.status !== 200) {
    return Response.json({ error: parsed.error }, { status: parsed.status });
  }
  if (parsed.rows.length === 0) {
    return Response.json({ accepted: 0, rejected: parsed.rejected });
  }

  // Multi-row insert; column identifiers are fixed literals (no injection
  // surface), values are parameterized. recorded_at/received_at = server clock.
  const placeholders: string[] = [];
  const values: unknown[] = [];
  parsed.rows.forEach((r, i) => {
    const o = i * 8;
    placeholders.push(
      `($${o + 1}, NOW(), $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7}, $${o + 8})`,
    );
    values.push(
      parsed.device_id,
      r.timestamp_ms,
      r.temperature_c,
      r.ph,
      r.light_relative_pct,
      r.light_voltage_v,
      r.xkc_level_state === null ? null : String(r.xkc_level_state), // '0'/'1'/NULL per database/README.md mapping
      r.firmware_version,
    );
  });
  const sql =
    "INSERT INTO telemetry_readings (device_id, recorded_at, timestamp_ms, temperature_c, ph, light_relative_pct, light_voltage_v, water_level_state, firmware_version) VALUES " +
    placeholders.join(", ");

  try {
    await db().query(sql, values);
  } catch (e) {
    return Response.json(
      { error: "database unavailable - readings NOT stored", detail: scrubError(e) },
      { status: 503 },
    );
  }

  return Response.json({ accepted: parsed.rows.length, rejected: parsed.rejected });
}
