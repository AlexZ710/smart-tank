import { db } from "@/lib/db";

// GET /api/health (frozen API surface, docs/Web_Facade_Architecture.md).
// Observation data only: never returns stored secrets; connection error
// details are credential-scrubbed. Degraded states report honestly instead
// of throwing 500s.

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.DATABASE_URL);
  let connected = false;
  let detail = configured ? "" : "DATABASE_URL not configured (see .env.example)";

  if (configured) {
    try {
      const client = await db().connect();
      try {
        await client.query("SELECT 1");
        connected = true;
      } finally {
        client.release();
      }
    } catch (e) {
      // Scrub any user:pass@ that could appear in connection error text.
      detail = (e instanceof Error ? e.message : "connection failed")
        .replace(/:[^:@/\s]+@/g, ":***@")
        .slice(0, 200);
    }
  }

  return Response.json({
    status: connected ? "ok" : "degraded",
    database: { configured, connected, detail },
    checked_at: new Date().toISOString(),
  });
}
