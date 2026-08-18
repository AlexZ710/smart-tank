import { NextRequest } from "next/server"; import { db } from "@/lib/db";
export async function GET(req:NextRequest) {
  const limit=Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")??288),1),2000);
  const r=await db().query("SELECT * FROM telemetry_readings ORDER BY recorded_at DESC LIMIT $1",[limit]);
  return Response.json({readings:r.rows.reverse()});
}
