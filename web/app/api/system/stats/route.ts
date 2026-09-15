import { ingestStats } from "@/lib/ingestStats";

// S24: GET /api/system/stats - aggregate counters backing the /system
// device-health UI. Deliberately secret-free: only counts, fixed-vocabulary
// reason keys and ISO timestamps. Scope is PER SERVER PROCESS (in-memory,
// resets on restart); a shared store is an S27 hardening item - the UI says
// so honestly instead of implying durable history.

export const dynamic = "force-dynamic";

export async function GET() {
  const uptimeS = Math.round(process.uptime());
  return Response.json({
    server: {
      started_at: new Date(Date.now() - uptimeS * 1000).toISOString(),
      uptime_s: uptimeS,
    },
    ingestion: ingestStats.snapshot(),
    scope:
      "per server process (in-memory, resets on restart); shared store is an S27 hardening item",
  });
}
