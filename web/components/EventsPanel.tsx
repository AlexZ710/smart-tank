"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RULE_CODES, SEVERITIES, type RuleCode, type Severity } from "@/lib/events";

// S26 Events panel: read-only feed over GET /api/events (frozen S11
// vocabulary ONLY - severity warning|critical, rule_code from the eight
// TEMP_*/PH_* codes; the API 400s anything else, so forbidden-sensor event
// codes can never be queried or rendered).
//
// HONESTY:
//  - rows mirror the events table exactly; nothing is simulated;
//  - an empty list is NOT proof of a healthy tank (stated in the empty state);
//  - severity uses the RESERVED status palette (warning #fab219, critical
//    #d03b3b) always WITH icon + text label - never color alone;
//  - refetch keeps the previous frame at reduced opacity; DB down shows an
//    honest notice, never a cached or invented feed.

type EventRow = {
  id: number;
  device_id: string;
  occurred_at: string;
  severity: Severity;
  rule_code: RuleCode;
  message: string;
  reading_id: number | null;
};

type Notice = { kind: "db_down" | "error"; text: string } | null;

const PRESETS = [
  { key: "24h", label: "Last 24 h", ms: 86_400_000 },
  { key: "7d", label: "Last 7 days", ms: 7 * 86_400_000 },
  { key: "30d", label: "Last 30 days", ms: 30 * 86_400_000 },
  { key: "all", label: "All time", ms: null },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"] | "custom";

function SeverityBadge({ severity }: { severity: Severity }) {
  // reserved status palette; icon + label always present (never color alone)
  if (severity === "critical") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white"
        style={{ backgroundColor: "#d03b3b" }}
      >
        <span aria-hidden="true">▲</span> critical
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-zinc-900"
      style={{ backgroundColor: "#fab219" }}
    >
      <span aria-hidden="true">⚠</span> warning
    </span>
  );
}

export default function EventsPanel() {
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [ruleCode, setRuleCode] = useState<RuleCode | "all">("all");
  const [preset, setPreset] = useState<PresetKey>("24h");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [limit, setLimit] = useState(200);
  const [nonce, setNonce] = useState(0);

  const [rows, setRows] = useState<EventRow[] | null>(null); // kept during refetch (frame hold)
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const range = useMemo(() => {
    if (preset === "custom") {
      if (!customFrom || !customTo) return null;
      const f = new Date(customFrom);
      const t = new Date(customTo);
      if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return null;
      if (t.getTime() < f.getTime()) return null;
      return { from: f.toISOString(), to: t.toISOString() };
    }
    const p = PRESETS.find((x) => x.key === preset);
    if (!p || p.ms === null) return { from: null, to: null }; // all time: no bounds
    const now = Date.now();
    return { from: new Date(now - p.ms).toISOString(), to: new Date(now).toISOString() };
  }, [preset, customFrom, customTo, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const runQuery = useCallback(async () => {
    if (!range) return;
    setLoading(true);
    setNotice(null);
    try {
      const qs = new URLSearchParams({ limit: String(limit) });
      if (range.from) qs.set("from", range.from);
      if (range.to) qs.set("to", range.to);
      if (severity !== "all") qs.set("severity", severity);
      if (ruleCode !== "all") qs.set("rule_code", ruleCode);
      const res = await fetch(`/api/events?${qs.toString()}`, { cache: "no-store" });
      const body = await res.json();
      if (res.status === 503) {
        setNotice({
          kind: "db_down",
          text: "Database unavailable — no events can be read. Nothing is cached or simulated; an empty feed is NOT proof that no events occurred.",
        });
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setNotice({ kind: "error", text: String(body?.error ?? `status ${res.status}`) });
        setLoading(false);
        return;
      }
      setRows((body.events ?? []) as EventRow[]);
      setCount(body.count ?? 0);
    } catch {
      setNotice({ kind: "error", text: "API unreachable — is the web server running?" });
    }
    setLoading(false);
  }, [range, limit, severity, ruleCode]);

  useEffect(() => {
    runQuery();
  }, [runQuery]);

  return (
    <div className="mt-6">
      {/* one filter row above everything it scopes; time range first */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setPreset(p.key);
                setNonce((n) => n + 1);
              }}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                preset === p.key
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreset("custom")}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              preset === "custom"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            Custom…
          </button>
        </div>

        {preset === "custom" && (
          <>
            <label className="text-xs opacity-70">
              from
              <input
                type="datetime-local"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
              />
            </label>
            <label className="text-xs opacity-70">
              to
              <input
                type="datetime-local"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
              />
            </label>
          </>
        )}

        <label className="text-xs opacity-70">
          severity
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity | "all")}
            className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
          >
            <option value="all">all</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs opacity-70">
          rule_code
          <select
            value={ruleCode}
            onChange={(e) => setRuleCode(e.target.value as RuleCode | "all")}
            className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 font-mono text-xs dark:border-zinc-700"
          >
            <option value="all">all (frozen S11 vocabulary)</option>
            {RULE_CODES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs opacity-70">
          limit
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
          >
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            setNonce((n) => n + 1);
            runQuery();
          }}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Refresh
        </button>

        {preset === "custom" && !range && (
          <span className="text-xs text-amber-700 dark:text-amber-400">
            set a valid custom range (to ≥ from) to query
          </span>
        )}
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          {notice.text}
        </div>
      )}

      <div className={loading ? "mt-4 opacity-50 transition-opacity" : "mt-4 transition-opacity"}>
        {rows == null && !loading && !notice ? (
          <p className="text-sm opacity-60">Loading events…</p>
        ) : rows != null && count === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="font-medium">No events match this filter</p>
            <p className="mt-2 text-sm opacity-70">
              Events come only from the deterministic S11 rule engine (TEMP_* / PH_* codes). An
              empty list is not proof of a healthy tank — if no telemetry is flowing, no rules can
              fire. Check <span className="font-mono">/system</span> for ingestion status.
            </p>
          </div>
        ) : rows != null ? (
          <>
            <p className="text-xs opacity-60">
              {count} event{count === 1 ? "" : "s"} (newest first)
              {count >= limit
                ? ` — LIST TRUNCATED AT THE ${limit}-ROW LIMIT: these are the NEWEST events; narrow the range to see older ones.`
                : ""}
            </p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide opacity-60 dark:border-zinc-800">
                  <tr>
                    <th className="px-3 py-2">occurred_at</th>
                    <th className="px-3 py-2">device</th>
                    <th className="px-3 py-2">severity</th>
                    <th className="px-3 py-2">rule_code</th>
                    <th className="px-3 py-2">message</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                        {new Date(e.occurred_at).toISOString().replace("T", " ").slice(0, 19)} UTC
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{e.device_id}</td>
                      <td className="px-3 py-2">
                        <SeverityBadge severity={e.severity} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{e.rule_code}</td>
                      <td className="px-3 py-2 text-xs opacity-80">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
