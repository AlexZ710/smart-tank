import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createRateLimiter } from "@/lib/ratelimit";
import {
  BOUNDARY_STATEMENT,
  buildBoundedPrompt,
  buildRecommendations,
  guardGeneratedText,
  renderRecommendations,
  type BoundedReportData,
  type ChannelStats,
} from "@/lib/reports";
import { scrubError } from "@/lib/scrub";

// S26: POST /api/reports/generate - bounded AI report generation per the
// FROZEN docs/prompt_boundary.md:
//  - INPUT boundary: the SQL below selects WHITELISTED columns only
//    (temperature/pH/light aggregates, deterministic events, manual
//    measurements) - forbidden-sensor columns can never reach the prompt.
//  - OUTPUT boundary: model text is scanned by guardGeneratedText BEFORE
//    storage; any forbidden claim discards the ENTIRE report (422, never
//    partially stored). Recommendations are appended deterministically from
//    S11 rule codes (never model-invented) with [REQUIRES HUMAN CONFIRMATION]
//    markers; the boundary statement is always appended verbatim.
//  - PROVIDER boundary: config is server-side env only (AI_PROVIDER,
//    AI_API_KEY, AI_MODEL, AI_BASEURL); unconfigured -> honest 503, no fake
//    report. Keys never appear in responses, logs or client bundles.
//  - Empty window -> "No telemetry available." report WITHOUT calling the
//    provider (mirrors reef_agent.py; no cost, no invention).
//  - Nothing is auto-executed: reports are text for human review only.

export const dynamic = "force-dynamic";

const MAX_WINDOW_MS = 7 * 86_400_000; // bounded: one week per report
const PROVIDER_TIMEOUT_MS = 30_000;
const MAX_COMPLETION_TOKENS = 800;

// Small dedicated limiter: generation is expensive and mutating (5/min/source).
const generateLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

type ProviderConfig = {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
};

function readProviderConfig(): ProviderConfig | null {
  const provider = process.env.AI_PROVIDER?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();
  const baseUrl = process.env.AI_BASEURL?.trim();
  if (!provider || !apiKey || !model || !baseUrl) return null;
  return { provider, apiKey, model, baseUrl };
}

async function callProvider(
  cfg: ProviderConfig,
  system: string,
  user: string,
): Promise<{ ok: true; text: string } | { ok: false; detail: string }> {
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.2,
        max_tokens: MAX_COMPLETION_TOKENS,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
  } catch (e) {
    return { ok: false, detail: scrubError(e) };
  }
  if (!res.ok) {
    const bodyText = (await res.text().catch(() => "")).slice(0, 200);
    // scrub in case a proxy echoes the request (Authorization never logged raw)
    return { ok: false, detail: scrubError(`provider HTTP ${res.status}: ${bodyText}`) };
  }
  try {
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, detail: "provider returned an empty completion" };
    return { ok: true, text };
  } catch (e) {
    return { ok: false, detail: scrubError(e) };
  }
}

export async function POST(req: NextRequest) {
  const source = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!generateLimiter.allow(source)) {
    return Response.json(
      { error: "rate limited", retry_after_s: generateLimiter.retryAfterS(source) },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "malformed JSON body" }, { status: 400 });
  }
  const { from: fromRaw, to: toRaw } = (body ?? {}) as { from?: unknown; to?: unknown };
  if (typeof fromRaw !== "string" || typeof toRaw !== "string") {
    return Response.json({ error: "from and to (ISO-8601) are required" }, { status: 400 });
  }
  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return Response.json({ error: "from/to must be valid ISO-8601 timestamps" }, { status: 400 });
  }
  if (to.getTime() < from.getTime()) {
    return Response.json({ error: "to must be >= from" }, { status: 400 });
  }
  if (to.getTime() - from.getTime() > MAX_WINDOW_MS) {
    return Response.json(
      { error: `window must be <= 7 days (bounded agent per docs/prompt_boundary.md)` },
      { status: 400 },
    );
  }

  const cfg = readProviderConfig();
  if (!cfg) {
    return Response.json(
      {
        error:
          "AI report generation not configured on server (AI_PROVIDER/AI_API_KEY/AI_MODEL/AI_BASEURL) - no report was generated or fabricated",
      },
      { status: 503 },
    );
  }

  // ---- Input boundary: whitelisted columns ONLY ----------------------------
  let stats: BoundedReportData;
  try {
    const [agg, ev, man] = await Promise.all([
      db().query(
        `SELECT COUNT(*)::int AS rows_total,
                COUNT(temperature_c)::int AS t_n, MIN(temperature_c) AS t_min, MAX(temperature_c) AS t_max, AVG(temperature_c) AS t_avg,
                COUNT(ph)::int AS p_n, MIN(ph) AS p_min, MAX(ph) AS p_max, AVG(ph) AS p_avg,
                COUNT(light_relative_pct)::int AS l_n, MIN(light_relative_pct) AS l_min, MAX(light_relative_pct) AS l_max, AVG(light_relative_pct) AS l_avg
         FROM telemetry_readings WHERE received_at >= $1 AND received_at <= $2`,
        [from, to],
      ),
      db().query(
        `SELECT rule_code, severity, COUNT(*)::int AS count
         FROM events WHERE occurred_at >= $1 AND occurred_at <= $2
         GROUP BY rule_code, severity ORDER BY rule_code ASC, severity ASC`,
        [from, to],
      ),
      db().query(
        `SELECT metric_name, value, unit, method, measured_at
         FROM manual_measurements WHERE measured_at >= $1 AND measured_at <= $2
         ORDER BY measured_at ASC LIMIT 100`,
        [from, to],
      ),
    ]);
    const a = agg.rows[0] as Record<string, unknown>;
    const rowsTotal = Number(a.rows_total ?? 0);
    const mk = (n: unknown, min: unknown, max: unknown, avg: unknown): ChannelStats => ({
      count: Number(n ?? 0),
      null_count: Math.max(0, rowsTotal - Number(n ?? 0)),
      min: min === null ? null : Number(min),
      max: max === null ? null : Number(max),
      avg: avg === null ? null : Number(avg),
    });
    const events = ev.rows.map((r) => ({
      rule_code: String(r.rule_code),
      severity: String(r.severity),
      count: Number(r.count),
    }));
    const recommendations = buildRecommendations(events.map((e) => e.rule_code));
    stats = {
      windowStart: from.toISOString(),
      windowEnd: to.toISOString(),
      totalRows: rowsTotal,
      channels: {
        temperature_c: mk(a.t_n, a.t_min, a.t_max, a.t_avg),
        ph: mk(a.p_n, a.p_min, a.p_max, a.p_avg),
        light_relative_pct: mk(a.l_n, a.l_min, a.l_max, a.l_avg),
      },
      events,
      manual: man.rows.map((r) => ({
        metric_name: String(r.metric_name),
        value: Number(r.value),
        unit: String(r.unit),
        method: String(r.method),
        measured_at: new Date(r.measured_at as string | Date).toISOString(),
      })),
      recommendationsMarkdown: renderRecommendations(recommendations),
    };
  } catch (e) {
    return Response.json(
      { error: "database unavailable - no data to summarize; report NOT generated", detail: scrubError(e) },
      { status: 503 },
    );
  }

  // ---- Empty window: honest no-data report, provider never called ----------
  let summary: string;
  let generatedBy: "provider" | "no-data-shortcut";
  if (stats.totalRows === 0 && stats.manual.length === 0 && stats.events.length === 0) {
    summary = "No telemetry available in the selected window.";
    generatedBy = "no-data-shortcut";
  } else {
    const prompt = buildBoundedPrompt(stats);
    const result = await callProvider(cfg, prompt.system, prompt.user);
    if (!result.ok) {
      return Response.json(
        { error: "bounded provider request failed - report NOT generated", detail: result.detail },
        { status: 502 },
      );
    }
    // ---- Output boundary: guard BEFORE storage; violation discards all -----
    const guard = guardGeneratedText(result.text);
    if (!guard.ok) {
      return Response.json(
        {
          error:
            "generated text violated the measurement boundary - report DISCARDED, not stored",
          term: guard.term,
          line: guard.line,
        },
        { status: 422 },
      );
    }
    summary = result.text;
    generatedBy = "provider";
  }

  const contentMarkdown = [
    summary.trim(),
    "",
    stats.recommendationsMarkdown,
    "",
    BOUNDARY_STATEMENT,
  ].join("\n");

  try {
    const ins = await db().query(
      `INSERT INTO reports (report_date, report_type, source_window_start, source_window_end, content_markdown)
       VALUES ($1::date, 'bounded_ai', $2, $3, $4)
       RETURNING id, report_date, report_type, source_window_start, source_window_end, content_markdown, created_at`,
      [to.toISOString().slice(0, 10), from, to, contentMarkdown],
    );
    const report = ins.rows[0];
    return Response.json({
      report,
      provenance: {
        generator: "bounded-agent (docs/prompt_boundary.md)",
        provider_type: cfg.provider,
        model: cfg.model,
        generated_by: generatedBy,
        confirmation_markers_preserved: true,
      },
    });
  } catch (e) {
    return Response.json(
      { error: "database unavailable - report generated but NOT stored", detail: scrubError(e) },
      { status: 503 },
    );
  }
}
