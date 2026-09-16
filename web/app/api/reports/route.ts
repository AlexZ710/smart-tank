import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { scrubError } from "@/lib/scrub";

// S26: GET /api/reports per the FROZEN docs/Telemetry_Contract.md.
// Rows mirror the reports table; each carries its generated-at (created_at),
// scope window (source_window_start/end) and bounded-agent provenance
// (report_type "bounded_ai" + the marker/boundary text inside
// content_markdown, stored verbatim). Recommendations keep
// [REQUIRES HUMAN CONFIRMATION] markers exactly as stored - this route never
// edits report bodies. Bounded by limit; DB down -> honest 503.

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limitRaw = sp.get("limit");
  const limit = limitRaw === null ? DEFAULT_LIMIT : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return Response.json(
      { error: `limit must be an integer 1..${MAX_LIMIT}` },
      { status: 400 },
    );
  }

  try {
    const r = await db().query(
      `SELECT id, report_date, report_type, source_window_start, source_window_end,
              content_markdown, created_at
       FROM reports
       ORDER BY report_date DESC, created_at DESC, id DESC
       LIMIT $1`,
      [limit],
    );
    return Response.json({ reports: r.rows, count: r.rows.length, limit });
  } catch (e) {
    return Response.json(
      { reports: [], error: "database unavailable", detail: scrubError(e) },
      { status: 503 },
    );
  }
}
