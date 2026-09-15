import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { scrubError } from "@/lib/scrub";

// S25: GET /api/experiments - READ-ONLY timeline source for the /experiments
// page (experiment_markers) plus manual-measurement provenance
// (manual_measurements). Markers are manual operator records entered via host
// tooling / seeded imports - this API never creates, mutates or deletes raw
// data (S25 goal: "without altering raw data"). Bounded by limit; rows mirror
// the stored tables; DB down -> honest 503, never fabricated timeline entries.

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

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
    const [markers, manual] = await Promise.all([
      db().query(
        `SELECT experiment_id, occurred_at, marker_type, label, notes
         FROM experiment_markers
         ORDER BY occurred_at ASC, id ASC
         LIMIT $1`,
        [limit],
      ),
      db().query(
        `SELECT id, experiment_id, measured_at, metric_name, value, unit, method, operator_note
         FROM manual_measurements
         ORDER BY measured_at ASC, id ASC
         LIMIT $1`,
        [limit],
      ),
    ]);
    return Response.json({
      markers: markers.rows,
      manual_measurements: manual.rows,
      limit,
      markers_truncated: markers.rows.length >= limit,
      manual_truncated: manual.rows.length >= limit,
    });
  } catch (e) {
    return Response.json(
      {
        markers: [],
        manual_measurements: [],
        error: "database unavailable",
        detail: scrubError(e),
      },
      { status: 503 },
    );
  }
}
