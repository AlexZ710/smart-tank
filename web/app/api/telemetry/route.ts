import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parseTelemetry } from "@/lib/validation";
export async function POST(req: NextRequest) {
  const expected = process.env.DEVICE_INGEST_TOKEN;
  const actual = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || actual !== expected) return Response.json({error:"unauthorized"},{status:401});
  try {
    const t = parseTelemetry(await req.json());
    const q = `INSERT INTO telemetry_readings (device_id,recorded_at,temperature_c,ph,light_raw,light_voltage_v,water_level_state,wifi_rssi_dbm,firmware_version,experiment_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, received_at`;
    const vals=[t.device_id,t.recorded_at,t.temperature_c,t.ph,t.light_raw,t.light_voltage_v,t.water_level_state??null,t.wifi_rssi_dbm??null,t.firmware_version,t.experiment_id??null];
    const r=await db().query(q,vals); return Response.json({ok:true,...r.rows[0]},{status:201});
  } catch (e) { return Response.json({error:e instanceof Error?e.message:"invalid request"},{status:400}); }
}
