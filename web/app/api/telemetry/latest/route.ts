import { db } from "@/lib/db";
export async function GET() {
  const r=await db().query("SELECT * FROM telemetry_readings ORDER BY recorded_at DESC LIMIT 1");
  return Response.json({reading:r.rows[0]??null});
}
