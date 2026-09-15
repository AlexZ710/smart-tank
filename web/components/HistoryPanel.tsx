"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import { groupRowsByDevice, type SeriesPoint } from "@/lib/charting";

// S25 History panel: bounded queries against GET /api/telemetry/history
// (S22 - from/to required, channel whitelist, limit <= 5000, ascending,
// gaps never interpolated). One filter row above everything it scopes:
// date-range presets first, then custom range, limit and device.
//
// HONESTY:
//  - only STORED rows are plotted; stored NULLs are skipped, never zero-filled;
//  - when the range returns `limit` rows the truncation is stated (rows are
//    the OLDEST in range - the API never downsamples or hides the cut);
//  - refetch keeps the previous frame at reduced opacity (no skeleton flash);
//  - empty range / DB down render honest notices, never simulated data.

type Row = {
  device_id: string;
  received_at: string;
  timestamp_ms: number | null;
  temperature_c: number | null;
  ph: number | null;
  light_relative_pct: number | null;
  light_voltage_v: number | null;
  water_level_state: string | null;
};

type PanelData = { rows: Row[]; count: number; from: string; to: string };
type Notice = { kind: "db_down" | "error"; text: string } | null;

const PRESETS = [
  { key: "1h", label: "Last 1 h", ms: 3_600_000 },
  { key: "24h", label: "Last 24 h", ms: 86_400_000 },
  { key: "7d", label: "Last 7 days", ms: 7 * 86_400_000 },
  { key: "30d", label: "Last 30 days", ms: 30 * 86_400_000 },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"] | "custom";

function channelPoints(rows: Row[], key: "temperature_c" | "ph" | "light_relative_pct"): SeriesPoint[] {
  const pts: SeriesPoint[] = [];
  for (const r of rows) {
    const v = r[key];
    if (v === null || v === undefined) continue; // stored NULL: skipped, never zero-filled
    const t = new Date(r.received_at).getTime();
    if (Number.isNaN(t)) continue;
    pts.push({ t, v: Number(v) });
  }
  return pts; // rows arrive ascending (received_at, id) per the contract
}

export default function HistoryPanel() {
  const [preset, setPreset] = useState<PresetKey>("24h");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [limit, setLimit] = useState(1000);
  const [deviceId, setDeviceId] = useState("");
  const [nonce, setNonce] = useState(0);

  const [data, setData] = useState<PanelData | null>(null); // kept during refetch (frame hold)
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
    if (!p) return null;
    const now = Date.now();
    return { from: new Date(now - p.ms).toISOString(), to: new Date(now).toISOString() };
  }, [preset, customFrom, customTo, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const runQuery = useCallback(async () => {
    if (!range) return;
    setLoading(true);
    setNotice(null);
    try {
      const qs = new URLSearchParams({ from: range.from, to: range.to, limit: String(limit) });
      if (deviceId.trim()) qs.set("device_id", deviceId.trim());
      const res = await fetch(`/api/telemetry/history?${qs.toString()}`, { cache: "no-store" });
      const body = await res.json();
      if (res.status === 503) {
        setNotice({ kind: "db_down", text: "Database unavailable — no history can be read. Nothing is cached, simulated or interpolated." });
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setNotice({ kind: "error", text: String(body?.error ?? `status ${res.status}`) });
        setLoading(false);
        return;
      }
      setData({ rows: (body.rows ?? []) as Row[], count: body.count ?? 0, from: body.from, to: body.to });
    } catch {
      setNotice({ kind: "error", text: "API unreachable — is the web server running?" });
    }
    setLoading(false);
  }, [range, limit, deviceId]);

  useEffect(() => {
    runQuery();
  }, [runQuery]);

  const groups = useMemo(() => (data ? groupRowsByDevice(data.rows) : []), [data]);

  return (
    <div className="mt-6">
      {/* one filter row above everything it scopes; date range first */}
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
          limit
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
          >
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={5000}>5000</option>
          </select>
        </label>

        <label className="text-xs opacity-70">
          device
          <input
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="all"
            className="ml-1 w-28 rounded-md border border-zinc-300 bg-transparent px-2 py-1 font-mono text-xs dark:border-zinc-700"
          />
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
        {data == null && !loading && !notice ? (
          <p className="text-sm opacity-60">Loading history…</p>
        ) : data != null && data.count === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="font-medium">No stored readings in this range</p>
            <p className="mt-2 text-sm opacity-70">
              {data.from} → {data.to} returned 0 rows. History shows stored data only — nothing is
              simulated, back-filled or interpolated.
            </p>
          </div>
        ) : data != null ? (
          <>
            <p className="text-xs opacity-60">
              {data.count} stored row{data.count === 1 ? "" : "s"} in range (ascending, oldest first)
              {data.count >= limit
                ? ` — RANGE TRUNCATED AT THE ${limit}-ROW LIMIT: these are the OLDEST rows in the window; narrow the range to see later data. The API never downsamples.`
                : ""}
            </p>
            {groups.map((g) => (
              <section key={g.device_id} className="mt-4">
                <h2 className="font-mono text-sm font-semibold">
                  {g.device_id} <span className="font-sans font-normal opacity-60">· {g.rows.length} rows</span>
                </h2>
                <div className="mt-3 grid gap-4 xl:grid-cols-3">
                  <TimeSeriesChart title="Temperature" unit="°C" digits={2} points={channelPoints(g.rows, "temperature_c")} />
                  <TimeSeriesChart title="pH" unit="pH" digits={2} points={channelPoints(g.rows, "ph")} />
                  <TimeSeriesChart title="Relative light" unit="%" digits={1} points={channelPoints(g.rows, "light_relative_pct")} />
                </div>
              </section>
            ))}
            <p className="mt-4 text-[11px] opacity-50">
              Light is relative % (PT550) — never lux/PAR/PPFD. The optional XKC water level is a
              binary state, not a continuous series: query it raw via the history API
              (channel=water_level_state) — it is deliberately not drawn as a line.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
