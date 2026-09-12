import { db } from "@/lib/db";
import { scrubError } from "@/lib/scrub";

// GET /api/health (frozen surface: docs/Telemetry_Contract.md S22 alignment).
// Contract shape: {"status": "ok"|"degraded", "database": "up"|"down",
// "version": "..."} - no secrets, no device tokens, no connection strings.
// Extra observability keys (detail, checked_at) carry credential-scrubbed
// information only. Degraded states report honestly instead of throwing 500s.

export const dynamic = "force-dynamic";

export const APP_VERSION = "0.2.0-s22";

export async function GET() {
  const configured = Boolean(process.env.DATABASE_URL);
  let up = false;
  let detail = configured ? "" : "DATABASE_URL not configured (see .env.example)";

  if (configured) {
    try {
      const client = await db().connect();
      try {
        await client.query("SELECT 1");
        up = true;
      } finally {
        client.release();
      }
    } catch (e) {
      detail = scrubError(e);
    }
  }

  return Response.json({
    status: up ? "ok" : "degraded",
    database: up ? "up" : "down",
    version: APP_VERSION,
    detail,
    checked_at: new Date().toISOString(),
  });
}
