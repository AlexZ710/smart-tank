import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  DEFAULT_EVENTS_LIMIT,
  MAX_EVENTS_LIMIT,
  RULE_CODES,
  SEVERITIES,
  isValidRuleCode,
  isValidSeverity,
} from "@/lib/events";
import { scrubError } from "@/lib/scrub";

// S26: GET /api/events per the FROZEN docs/Telemetry_Contract.md.
//  - Query: from, to (optional ISO filters), severity (warning|critical),
//    rule_code (frozen S11 vocabulary ONLY - anything else is 400, which is
//    also the forbidden-sensor guard: ORP_/EC_/FLOW_ codes cannot even be
//    queried), limit (default 200, max 1000 -> 400 over).
//  - Rows mirror the events table exactly:
//    {id, device_id, occurred_at, severity, rule_code, message, reading_id}.
//  - Newest first (occurred_at DESC, id DESC) for the events feed.
//  - DB down -> 503 honest error; empty window -> 200 with [] (never 404).

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const severityRaw = sp.get("severity");
  if (severityRaw !== null && !isValidSeverity(severityRaw)) {
    return Response.json(
      { error: `severity must be one of: ${SEVERITIES.join(", ")}` },
      { status: 400 },
    );
  }

  const ruleCodeRaw = sp.get("rule_code");
  if (ruleCodeRaw !== null && !isValidRuleCode(ruleCodeRaw)) {
    return Response.json(
      { error: `rule_code outside the frozen S11 vocabulary; allowed: ${RULE_CODES.join(", ")}` },
      { status: 400 },
    );
  }

  const limitRaw = sp.get("limit");
  const limit = limitRaw === null ? DEFAULT_EVENTS_LIMIT : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_EVENTS_LIMIT) {
    return Response.json(
      { error: `limit must be an integer 1..${MAX_EVENTS_LIMIT} (contract cap)` },
      { status: 400 },
    );
  }

  const where: string[] = [];
  const params: unknown[] = [];
  const fromRaw = sp.get("from");
  const toRaw = sp.get("to");
  if (fromRaw !== null) {
    const from = new Date(fromRaw);
    if (Number.isNaN(from.getTime())) {
      return Response.json({ error: "from must be a valid ISO-8601 timestamp" }, { status: 400 });
    }
    params.push(from);
    where.push(`occurred_at >= $${params.length}`);
  }
  if (toRaw !== null) {
    const to = new Date(toRaw);
    if (Number.isNaN(to.getTime())) {
      return Response.json({ error: "to must be a valid ISO-8601 timestamp" }, { status: 400 });
    }
    params.push(to);
    where.push(`occurred_at <= $${params.length}`);
  }
  if (severityRaw !== null) {
    params.push(severityRaw);
    where.push(`severity = $${params.length}`);
  }
  if (ruleCodeRaw !== null) {
    params.push(ruleCodeRaw);
    where.push(`rule_code = $${params.length}`);
  }
  const deviceId = sp.get("device_id");
  if (deviceId) {
    params.push(deviceId);
    where.push(`device_id = $${params.length}`);
  }
  params.push(limit);

  try {
    const r = await db().query(
      `SELECT id, device_id, occurred_at, severity, rule_code, message, reading_id
       FROM events
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY occurred_at DESC, id DESC
       LIMIT $${params.length}`,
      params,
    );
    return Response.json({ events: r.rows, count: r.rows.length, limit });
  } catch (e) {
    return Response.json(
      { events: [], error: "database unavailable", detail: scrubError(e) },
      { status: 503 },
    );
  }
}
