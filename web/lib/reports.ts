// S26: bounded AI-report logic, a faithful TypeScript mirror of the frozen
// docs/prompt_boundary.md rules enforced in backend/ai_agent/reef_agent.py.
// Pure functions only (no I/O) so the boundary is unit-testable:
//  - RECOMMENDATION_MAP: recommendations originate ONLY from deterministic
//    S11 rule_codes - the model never invents them;
//  - guardGeneratedText: model output is scanned BEFORE storage; a forbidden
//    claim discards the whole report (absence/rejection prose is allowed,
//    mirroring the repo-wide audit pattern);
//  - buildBoundedPrompt: the provider receives ONLY this bounded prompt with
//    guard-passed observed data embedded (input boundary);
//  - CONFIRMATION_MARKER / BOUNDARY_STATEMENT: rendered verbatim, always.

export const CONFIRMATION_MARKER = "[REQUIRES HUMAN CONFIRMATION]";

export const BOUNDARY_STATEMENT =
  "Boundary: ORP, EC/conductivity, ZP4510 float state, FS300A flow and any " +
  "other unlisted parameter are NOT measured in this hardware baseline. " +
  "Salinity and ammonia exist only as manual measurements. Nothing in this " +
  "report may be acted on automatically.";

// Verbatim mirror of reef_agent.py RECOMMENDATION_MAP (observation /
// verification actions only - never dosing, never mains switching).
export const RECOMMENDATION_MAP: Record<string, string> = {
  TEMP_MISSING:
    "Check DS18B20 wiring/probe on GPIO4 and collect a fresh reading before drawing conclusions.",
  TEMP_INVALID:
    "A temperature reading failed plausibility cleaning; verify the DS18B20 probe and wiring, then re-measure.",
  TEMP_OUT_OF_RANGE:
    "Verify tank temperature manually with a reference thermometer and inspect heater/fan settings.",
  TEMP_CRITICAL:
    "URGENTLY verify temperature manually with a reference thermometer and inspect heating/cooling equipment. Manual intervention only - no automatic dosing or mains switching.",
  PH_MISSING:
    "Check the SEN0161-V2 / ADS1115 (A1) wiring and collect a fresh reading.",
  PH_INVALID:
    "A pH reading failed plausibility cleaning; verify sensor wiring and calibration state, then re-measure.",
  PH_OUT_OF_RANGE:
    "Confirm pH calibration with fresh 7.00/4.00 buffers (docs/ph_calibration_log.md) and re-measure before any intervention.",
  PH_CRITICAL:
    "URGENTLY confirm pH calibration with fresh buffers and re-measure. Manual intervention only - no automatic dosing.",
};

/**
 * Deterministic recommendations from the window's rule events.
 * Deduplicated (first-seen order); codes outside RECOMMENDATION_MAP are
 * ignored - a recommendation can never be invented here.
 */
export function buildRecommendations(
  ruleCodes: readonly string[],
): { rule_code: string; suggestion: string }[] {
  const seen = new Set<string>();
  const out: { rule_code: string; suggestion: string }[] = [];
  for (const code of ruleCodes) {
    if (seen.has(code) || !(code in RECOMMENDATION_MAP)) continue;
    seen.add(code);
    out.push({ rule_code: code, suggestion: RECOMMENDATION_MAP[code] });
  }
  return out;
}

/** Markdown block appended AFTER the guarded model text (server-side). */
export function renderRecommendations(
  recs: readonly { rule_code: string; suggestion: string }[],
): string {
  const lines = ["## Recommendations (deterministic, from rule events)"];
  if (recs.length === 0) {
    lines.push("- No candidate recommendations; continue routine observation.");
  } else {
    for (const r of recs) {
      lines.push(`- \`${r.rule_code}\` ${r.suggestion} ${CONFIRMATION_MARKER}`);
    }
  }
  return lines.join("\n");
}

// Lowercase-substring forbidden claim terms (output side). Match patterns use
// word boundaries where the raw substring would false-positive ("part",
// "overflow"). Terms may appear ONLY in absence/rejection prose.
const FORBIDDEN_CLAIM_PATTERNS: { re: RegExp; term: string }[] = [
  { re: /\borp\b/i, term: "orp" },
  { re: /conductivity/i, term: "conductivity" },
  { re: /\bec\b/i, term: "ec" },
  { re: /zp4510/i, term: "zp4510" },
  { re: /fs300a/i, term: "fs300a" },
  { re: /\blux\b/i, term: "lux" },
  { re: /\bpar\b/i, term: "par" },
  { re: /ppfd/i, term: "ppfd" },
  { re: /\bflow\b/i, term: "flow" },
  { re: /\bfloat\s+switch\w*\b/i, term: "float switch" },
  { re: /\bdosing\b/i, term: "dosing" },
  { re: /\bmains\s+(switching|voltage|power)\b/i, term: "mains control" },
];

// Absence/rejection cues - the same allowance the repo-wide forbidden-term
// audits use ("residuals must be rejection prose").
const REJECTION_CUE =
  /\b(not|never|no|none|absent|absence|unavailable|unmeasured|cannot|can't|doesn't|don't|isn't|aren't|forbidden|rejected|excluded|without|instead)\b/i;

export type GuardResult =
  | { ok: true }
  | { ok: false; term: string; line: string };

/**
 * Scan model-generated text BEFORE storage. A line containing a forbidden
 * term is a violation unless the same line states absence/rejection.
 * A violation discards the ENTIRE report - never partially stored.
 */
export function guardGeneratedText(text: string): GuardResult {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (REJECTION_CUE.test(line)) continue; // absence/rejection prose is allowed
    for (const p of FORBIDDEN_CLAIM_PATTERNS) {
      if (p.re.test(line)) {
        return { ok: false, term: p.term, line: line.slice(0, 160) };
      }
    }
  }
  return { ok: true };
}

// ---- Bounded prompt (input boundary) ---------------------------------------

export type ChannelStats = {
  count: number; // stored non-null samples in window
  null_count: number; // stored NULLs (not measured) in window
  min: number | null;
  max: number | null;
  avg: number | null;
};

export type BoundedReportData = {
  windowStart: string; // ISO
  windowEnd: string; // ISO
  totalRows: number;
  channels: {
    temperature_c: ChannelStats;
    ph: ChannelStats;
    light_relative_pct: ChannelStats; // relative % ONLY
  };
  events: { rule_code: string; severity: string; count: number }[];
  manual: {
    metric_name: string;
    value: number;
    unit: string;
    method: string;
    measured_at: string;
  }[];
  recommendationsMarkdown: string;
};

/**
 * The EXACT bounded prompt an approved provider may receive (mirrors
 * reef_agent.build_llm_prompt). Only guard-passed, aggregated observed data
 * is embedded - raw forbidden columns can never appear because the SQL
 * selects whitelisted columns only.
 */
export function buildBoundedPrompt(data: BoundedReportData): {
  system: string;
  user: string;
} {
  const system = [
    "You are a bounded aquarium reporting assistant for a 5 L monitoring-only reef tank.",
    "Rules you must follow:",
    "1. Use ONLY the observed data embedded in the user message. Never invent, estimate or interpolate measurements.",
    "2. ORP, EC/conductivity, flow and float-switch data are NOT measured by this system; never claim otherwise.",
    "3. Light is a relative percentage only; never express it as lux, PAR or PPFD.",
    `4. Every recommendation you repeat must keep its ${CONFIRMATION_MARKER} marker and be phrased as a suggestion for a human to confirm. Never instruct automatic dosing or mains switching.`,
    "5. Restate and organize only. If a channel has no data in the window, say it has no data - never fill it in.",
    "Write a concise markdown observation summary (a few short sections). Do NOT add your own recommendations section - it is appended deterministically.",
  ].join("\n");

  const ch = (name: string, s: ChannelStats, unit: string) =>
    `- ${name} (${unit}): stored samples=${s.count}, not-measured(NULL)=${s.null_count}, ` +
    (s.count > 0
      ? `min=${s.min}, max=${s.max}, avg=${s.avg == null ? null : Number(s.avg.toFixed(3))}`
      : "no data in window");

  const user = [
    `Observation window: ${data.windowStart} .. ${data.windowEnd} (UTC)`,
    `Stored telemetry rows in window: ${data.totalRows}`,
    "",
    "Observed channel statistics (stored rows only; NULL means not measured):",
    ch("temperature_c", data.channels.temperature_c, "°C, DS18B20"),
    ch("ph", data.channels.ph, "pH, SEN0161-V2"),
    ch("light_relative_pct", data.channels.light_relative_pct, "relative %, PT550 - never lux/PAR/PPFD"),
    "",
    "Deterministic rule events in window (S11 engine; counts):",
    data.events.length === 0
      ? "- none"
      : data.events.map((e) => `- ${e.rule_code} (${e.severity}): ${e.count}`).join("\n"),
    "",
    "Manual measurements in window (label them manual, with method):",
    data.manual.length === 0
      ? "- none"
      : data.manual
          .map((m) => `- ${m.metric_name}=${m.value} ${m.unit} (method: ${m.method}, at ${m.measured_at})`)
          .join("\n"),
    "",
    "The following recommendations block will be appended verbatim after your summary; you may reference but never alter it:",
    data.recommendationsMarkdown,
    "",
    BOUNDARY_STATEMENT,
  ].join("\n");

  return { system, user };
}
