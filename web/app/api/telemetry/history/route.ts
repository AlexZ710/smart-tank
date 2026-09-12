import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { scrubError } from "@/lib/scrub";

// S22: GET /api/telemetry/history per the FROZEN docs/Telemetry_Contract.md.
//  - from & to (ISO-8601) required -> 400 when missing/invalid.
//  - channel optional, restricted to a whitelist (also the SQL-identifier
//    injection guard); limit default 1000, over-max (>5000) -> 400.
//  - Rows ordered ascending by (received_at, id); gaps are NEVER
//    interpolated - stored rows only.

export const dynamic = "force-dynamic";

const CHANNEL_COLUMNS = new Set([
  "timestamp_ms",
  "temperature_c",
  "ph",
  "light_relative_pct",
  "light_voltage_v",
  "water_level_state",
]);

const MAX_LIMIT = 5000;
const DEFAULT_LIMIT = 1000;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const fromRaw = sp.get("from");
  const toRaw = sp.get("to");
  if (!fromRaw || !toRaw) {
    return Response.json({ error: "from and to (ISO-8601) are required" }, { status: 400 });
  }
  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return Response.json({ error: "from/to must be valid ISO-8601 timestamps" }, { status: 400 });
  }
  if (to.getTime() < from.getTime()) {
    return Response.json({ error: "to must be >= from" }, { status: 400 });
  }

  const limitRaw = sp.get("limit");
  const limit = limitRaw === null ? DEFAULT_LIMIT : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return Response.json(
      { error: `limit must be an integer 1..${MAX_LIMIT} (over-max rejected per contract)` },
      { status: 400 },
    );
  }

  const channel = sp.get("channel");
  if (channel !== null && !CHANNEL_COLUMNS.has(channel)) {
    return Response.json(
      { error: `unknown channel; allowed: ${[...CHANNEL_COLUMNS].join(", ")}` },
      { status: 400 },
    );
  }

  const deviceId = sp.get("device_id");
  const where = ["received_at >= $1", "received_at <= $2"];
  const params: unknown[] = [from, to];
  if (deviceId) {
    params.push(deviceId);
    where.push(`device_id = $${params.length}`);
  }
  params.push(limit);

  // `channel` is interpolated as a column identifier ONLY after passing the
  // whitelist above; every user value goes through parameters.
  const cols = channel
    ? `device_id, received_at, timestamp_ms, ${channel}`
    : "device_id, received_at, timestamp_ms, temperature_c, ph, light_relative_pct, light_voltage_v, water_level_state";

  try {
    const r = await db().query(
      `SELECT ${cols} FROM telemetry_readings
       WHERE ${where.join(" AND ")}
       ORDER BY received_at ASC, id ASC
       LIMIT $${params.length}`,
      params,
    );
    return Response.json({
      from: from.toISOString(),
      to: to.toISOString(),
      count: r.rows.length,
      rows: r.rows,
    });
  } catch (e) {
    return Response.json(
      { rows: [], error: "database unavailable", detail: scrubError(e) },
      { status: 503 },
    );
  }
}
