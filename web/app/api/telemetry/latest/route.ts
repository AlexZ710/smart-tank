import { db } from "@/lib/db";
import { scrubError } from "@/lib/scrub";
import { STALE_AFTER_S, stateForValue } from "@/lib/states";

// S22: GET /api/telemetry/latest per the FROZEN docs/Telemetry_Contract.md.
// Newest reading per device with computed six-state semantics. No device rows
// at all -> 200 {"devices": []} (honest empty, never 404). Database down ->
// 503 with an honest error (never fabricated readings).

export const dynamic = "force-dynamic";

type Row = {
  device_id: string;
  received_at: Date | string;
  timestamp_ms: number | null;
  temperature_c: number | null;
  ph: number | null;
  light_relative_pct: number | null;
  water_level_state: string | null;
};

export async function GET() {
  let rows: Row[];
  try {
    const r = await db().query(
      `SELECT DISTINCT ON (device_id) device_id, received_at, timestamp_ms,
              temperature_c, ph, light_relative_pct, water_level_state
       FROM telemetry_readings
       ORDER BY device_id, received_at DESC, id DESC`,
    );
    rows = r.rows as Row[];
  } catch (e) {
    return Response.json(
      { devices: [], error: "database unavailable", detail: scrubError(e) },
      { status: 503 },
    );
  }

  const devices = rows.map((row) => {
    const receivedAt = new Date(row.received_at);
    const ageS = (Date.now() - receivedAt.getTime()) / 1000;
    return {
      device_id: row.device_id,
      received_at: receivedAt.toISOString(),
      timestamp_ms: row.timestamp_ms ?? null,
      age_s: Math.round(ageS),
      state: ageS <= STALE_AFTER_S ? "CURRENT" : "STALE",
      channels: {
        temperature_c: {
          value: row.temperature_c ?? null,
          state: stateForValue(row.temperature_c, ageS),
        },
        ph: {
          value: row.ph ?? null,
          state: stateForValue(row.ph, ageS),
        },
        light_relative_pct: {
          value: row.light_relative_pct ?? null,
          state: stateForValue(row.light_relative_pct, ageS),
        },
        xkc_level_state: {
          // '0'/'1'/NULL in DB -> 0/1/null in JSON (contract mapping).
          value: row.water_level_state === null ? null : Number(row.water_level_state),
          state: stateForValue(row.water_level_state, ageS, { optional: true }),
        },
      },
    };
  });

  return Response.json({ devices });
}
