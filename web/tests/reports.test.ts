// S26 bounded-report tests: the TypeScript mirror of docs/prompt_boundary.md
// must keep recommendations deterministic, preserve confirmation markers,
// guard model output BEFORE storage (absence/rejection prose allowed), and
// build the provider prompt from whitelisted aggregates only.
import test from "node:test";
import assert from "node:assert/strict";
import {
  BOUNDARY_STATEMENT,
  CONFIRMATION_MARKER,
  RECOMMENDATION_MAP,
  buildBoundedPrompt,
  buildRecommendations,
  guardGeneratedText,
  renderRecommendations,
  type BoundedReportData,
} from "../lib/reports.ts";
import { RULE_CODES } from "../lib/events.ts";

test("marker and boundary statement are verbatim", () => {
  assert.equal(CONFIRMATION_MARKER, "[REQUIRES HUMAN CONFIRMATION]");
  assert.match(BOUNDARY_STATEMENT, /NOT measured in this hardware baseline/);
  assert.match(BOUNDARY_STATEMENT, /manual measurements/);
  assert.match(BOUNDARY_STATEMENT, /never|Nothing in this report may be acted on automatically/i);
});

test("RECOMMENDATION_MAP covers exactly the frozen S11 vocabulary", () => {
  assert.deepEqual(Object.keys(RECOMMENDATION_MAP).sort(), [...RULE_CODES].sort());
  for (const text of Object.values(RECOMMENDATION_MAP)) {
    // observation/verification only - never dosing or mains switching
    assert.ok(!/\bdosing\b/i.test(text.replace(/no automatic dosing/gi, "")));
    assert.ok(!/\bmains\s+switching\b/i.test(text.replace(/no automatic dosing or mains switching/gi, "")));
  }
});

test("buildRecommendations dedupes (first-seen) and ignores unknown codes", () => {
  const recs = buildRecommendations([
    "TEMP_CRITICAL",
    "PH_MISSING",
    "TEMP_CRITICAL",
    "ORP_HIGH", // absent sensor: never mapped
    "FLOW_STUCK",
    "",
  ]);
  assert.deepEqual(
    recs.map((r) => r.rule_code),
    ["TEMP_CRITICAL", "PH_MISSING"],
  );
  assert.equal(recs[0].suggestion, RECOMMENDATION_MAP.TEMP_CRITICAL);
});

test("renderRecommendations: every rec line carries the marker verbatim", () => {
  const md = renderRecommendations(buildRecommendations(["PH_OUT_OF_RANGE", "TEMP_MISSING"]));
  const lines = md.split("\n").filter((l) => l.startsWith("- "));
  assert.equal(lines.length, 2);
  for (const l of lines) assert.ok(l.includes(CONFIRMATION_MARKER), l);
  assert.match(md, /^## Recommendations \(deterministic, from rule events\)/);
});

test("renderRecommendations with no recs stays honest (routine observation)", () => {
  const md = renderRecommendations([]);
  assert.match(md, /No candidate recommendations; continue routine observation\./);
});

test("guardGeneratedText passes clean restate-only text", () => {
  const g = guardGeneratedText(
    "## Summary\nTemperature averaged 25.4 °C over 120 stored samples.\npH stayed between 8.05 and 8.21.\nRelative light peaked at 62 % (relative scale only).",
  );
  assert.deepEqual(g, { ok: true });
});

test("guardGeneratedText rejects forbidden measurement claims", () => {
  const cases: [string, string][] = [
    ["ORP reads 220 mV, which is healthy.", "orp"], // should reject: forbidden claim
    ["Conductivity suggests salinity of 1.025 SG.", "conductivity"], // should reject
    ["The EC value is stable at 53 mS.", "ec"], // should reject
    ["Check the ZP4510 float state.", "zp4510"], // should reject
    ["The FS300A sensor shows 200 L/h.", "fs300a"], // should reject
    ["Light measured 12000 lux at the surface.", "lux"], // should reject
    ["PAR is around 150 at the coral level.", "par"], // should reject
    ["PPFD peaked at 180.", "ppfd"], // should reject
    ["Flow rate dropped overnight.", "flow"], // should reject
    ["The float switch triggered at 09:00.", "float switch"], // should reject
    ["Start automatic dosing of alkalinity.", "dosing"], // should reject
    ["Switch the mains power to the heater.", "mains control"], // should reject
  ];
  for (const [line, term] of cases) {
    const g = guardGeneratedText(line);
    assert.equal(g.ok, false, `should reject: ${line}`);
    assert.ok(!g.ok);
    if (!g.ok) assert.equal(g.term, term);
  }
});

test("guardGeneratedText allows absence/rejection prose (mirrors repo audits)", () => {
  for (const line of [
    "ORP is not measured by this system.",
    "No conductivity sensor is installed in this baseline.",
    "Flow data is unavailable; the FS300A is absent from the hardware.",
    "Lux/PAR/PPFD cannot be derived - light is a relative percentage only.",
    "Automatic dosing is forbidden; manual intervention only.",
  ]) {
    assert.deepEqual(guardGeneratedText(line), { ok: true }, line);
  }
});

test("guardGeneratedText: a violation anywhere discards the whole report", () => {
  const text = "Line one is clean.\nORP reads 220 mV.\nLine three is clean.";
  const g = guardGeneratedText(text);
  assert.equal(g.ok, false);
  assert.ok(!g.ok);
  if (!g.ok) {
    assert.equal(g.term, "orp");
    assert.equal(g.line, "ORP reads 220 mV.");
  }
});

const baseData: BoundedReportData = {
  windowStart: "2026-09-15T00:00:00.000Z",
  windowEnd: "2026-09-16T00:00:00.000Z",
  totalRows: 120,
  channels: {
    temperature_c: { count: 118, null_count: 2, min: 25.1, max: 25.9, avg: 25.432 },
    ph: { count: 119, null_count: 1, min: 8.05, max: 8.21, avg: 8.13 },
    light_relative_pct: { count: 120, null_count: 0, min: 0.4, max: 62, avg: 31.2 },
  },
  events: [{ rule_code: "TEMP_OUT_OF_RANGE", severity: "warning", count: 3 }],
  manual: [
    {
      metric_name: "salinity_sg",
      value: 1.025,
      unit: "sg",
      method: "refractometer",
      measured_at: "2026-09-15T12:00:00.000Z",
    },
  ],
  recommendationsMarkdown: renderRecommendations(buildRecommendations(["TEMP_OUT_OF_RANGE"])),
};

test("buildBoundedPrompt embeds window, stats, events, manual and the marker rule", () => {
  const p = buildBoundedPrompt(baseData);
  assert.match(p.system, /bounded aquarium reporting assistant/i);
  assert.match(p.system, /Never invent, estimate or interpolate/);
  assert.match(p.system, /NOT measured by this system/);
  assert.match(p.system, /relative percentage only/);
  assert.ok(p.system.includes(CONFIRMATION_MARKER));
  assert.match(p.system, /Do NOT add your own recommendations section/);

  assert.ok(p.user.includes(baseData.windowStart));
  assert.ok(p.user.includes(baseData.windowEnd));
  assert.match(p.user, /Stored telemetry rows in window: 120/);
  assert.match(p.user, /temperature_c .*stored samples=118, not-measured\(NULL\)=2/);
  assert.match(p.user, /min=25\.1, max=25\.9, avg=25\.432/);
  assert.match(p.user, /light_relative_pct .*relative %, PT550 - never lux\/PAR\/PPFD/);
  assert.match(p.user, /TEMP_OUT_OF_RANGE \(warning\): 3/);
  assert.match(p.user, /salinity_sg=1\.025 sg \(method: refractometer/);
  assert.ok(p.user.includes(baseData.recommendationsMarkdown));
  assert.ok(p.user.endsWith(BOUNDARY_STATEMENT));
});

test("buildBoundedPrompt: empty channels state 'no data in window'", () => {
  const empty: BoundedReportData = {
    ...baseData,
    totalRows: 0,
    channels: {
      temperature_c: { count: 0, null_count: 0, min: null, max: null, avg: null },
      ph: { count: 0, null_count: 0, min: null, max: null, avg: null },
      light_relative_pct: { count: 0, null_count: 0, min: null, max: null, avg: null },
    },
    events: [],
    manual: [],
    recommendationsMarkdown: renderRecommendations([]),
  };
  const p = buildBoundedPrompt(empty);
  assert.match(p.user, /temperature_c .*no data in window/);
  assert.match(p.user, /Deterministic rule events[\s\S]*- none/);
  assert.match(p.user, /Manual measurements[\s\S]*- none/);
});
