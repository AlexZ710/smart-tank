"use client";

import { useEffect, useMemo, useState } from "react";
import DataStateBadge from "@/components/DataStateBadge";

// S25 Experiments panel: timeline built from the experiment_markers table
// plus manual-measurement provenance, via READ-ONLY GET /api/experiments.
// Markers are manual operator records (host tooling / seeded imports) - they
// are NEVER auto-generated and this UI never writes. Manual salinity/ammonia
// entries always render labeled MANUAL with measured_at + method (frozen
// honesty rule). Empty DB -> honest empty state; DB down -> honest notice.

type Marker = {
  experiment_id: string;
  occurred_at: string;
  marker_type: string;
  label: string;
  notes: string | null;
};

type ManualRow = {
  id: number;
  experiment_id: string | null;
  measured_at: string;
  metric_name: string;
  value: number;
  unit: string;
  method: string;
  operator_note: string | null;
};

type PanelState =
  | { kind: "loading" }
  | { kind: "db_down"; detail?: string }
  | { kind: "error"; text: string }
  | {
      kind: "ok";
      markers: Marker[];
      manual: ManualRow[];
      markersTruncated: boolean;
      manualTruncated: boolean;
    };

async function load(): Promise<PanelState> {
  let res: Response;
  try {
    res = await fetch("/api/experiments", { cache: "no-store" });
  } catch {
    return { kind: "error", text: "API unreachable - is the web server running?" };
  }
  let body: Record<string, unknown>;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    return { kind: "error", text: "malformed response from /api/experiments" };
  }
  if (res.status === 503) {
    return { kind: "db_down", detail: typeof body.detail === "string" ? body.detail : undefined };
  }
  if (!res.ok) {
    return { kind: "error", text: String(body.error ?? `status ${res.status}`) };
  }
  return {
    kind: "ok",
    markers: (body.markers ?? []) as Marker[],
    manual: (body.manual_measurements ?? []) as ManualRow[],
    markersTruncated: Boolean(body.markers_truncated),
    manualTruncated: Boolean(body.manual_truncated),
  };
}

function groupMarkers(markers: Marker[]): { experiment_id: string; markers: Marker[] }[] {
  const order: string[] = [];
  const map = new Map<string, Marker[]>();
  for (const m of markers) {
    let bucket = map.get(m.experiment_id);
    if (!bucket) {
      bucket = [];
      map.set(m.experiment_id, bucket);
      order.push(m.experiment_id);
    }
    bucket.push(m);
  }
  return order.map((experiment_id) => ({ experiment_id, markers: map.get(experiment_id) as Marker[] }));
}

export default function ExperimentsPanel() {
  const [panel, setPanel] = useState<PanelState>({ kind: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    load().then((p) => {
      if (alive) setPanel(p);
    });
    return () => {
      alive = false;
    };
  }, [nonce]);

  const groups = useMemo(
    () => (panel.kind === "ok" ? groupMarkers(panel.markers) : []),
    [panel],
  );

  return (
    <div className="mt-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      {panel.kind === "loading" && <p className="mt-4 text-sm opacity-60">Loading experiment timeline…</p>}

      {panel.kind === "error" && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          {panel.text} No timeline entries are shown because none could be read - nothing is fabricated.
        </div>
      )}

      {panel.kind === "db_down" && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          Database unavailable - the experiment timeline cannot be read{panel.detail ? ` (${panel.detail})` : ""}.
          Markers and manual entries are stored records; they are never simulated while the database is down.
        </div>
      )}

      {panel.kind === "ok" && (
        <>
          <section>
            <h2 className="text-lg font-semibold">Experiment timeline</h2>
            <p className="mt-1 text-xs opacity-60">
              Markers are manual operator records (host tooling / seeded imports) - never
              auto-generated, never altered by this UI.
              {panel.markersTruncated && " Showing the oldest rows up to the query limit - narrow the limit window for more."}
            </p>

            {panel.markers.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="font-medium">No experiment markers recorded yet</p>
                <p className="mt-2 text-sm opacity-70">
                  EXP01–EXP05 protocols are prepared (<code>experiments/</code>); their execution
                  is pending hardware and a running tank. When markers are logged they appear here
                  in chronological order with full manual provenance.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                {groups.map((g) => (
                  <div key={g.experiment_id}>
                    <h3 className="font-mono text-sm font-semibold">{g.experiment_id}</h3>
                    <ol className="mt-2 space-y-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                      {g.markers.map((m) => (
                        <li key={`${m.experiment_id}-${m.occurred_at}-${m.label}`} className="relative">
                          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-400 dark:border-zinc-950" />
                          <div className="flex flex-wrap items-baseline gap-2 text-sm">
                            <span className="font-medium">{m.label}</span>
                            <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] opacity-70 dark:border-zinc-700">
                              {m.marker_type}
                            </span>
                            <span className="text-xs opacity-60">{new Date(m.occurred_at).toLocaleString()}</span>
                          </div>
                          {m.notes && <p className="mt-1 text-xs opacity-70">{m.notes}</p>}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Manual measurements</h2>
            <p className="mt-1 text-xs opacity-60">
              Manual-only channels (salinity, ammonia) enter via host tooling - never via device
              ingestion - and always render labeled MANUAL with measured_at + method.
              {panel.manualTruncated && " Showing the oldest rows up to the query limit."}
            </p>

            {panel.manual.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm opacity-70 dark:border-zinc-700">
                No manual measurements logged yet. Nothing is displayed until an operator records
                a measurement - values are never estimated or back-filled.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs opacity-60 dark:border-zinc-700">
                      <th className="py-1.5 pr-3">state</th>
                      <th className="py-1.5 pr-3">measured at</th>
                      <th className="py-1.5 pr-3">metric</th>
                      <th className="py-1.5 pr-3 text-right">value</th>
                      <th className="py-1.5 pr-3">method</th>
                      <th className="py-1.5 pr-3">experiment</th>
                      <th className="py-1.5">operator note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panel.manual.map((r) => (
                      <tr key={r.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                        <td className="py-1.5 pr-3">
                          <DataStateBadge state="MANUAL" age={`measured ${new Date(r.measured_at).toLocaleString()}`} />
                        </td>
                        <td className="py-1.5 pr-3">{new Date(r.measured_at).toLocaleString()}</td>
                        <td className="py-1.5 pr-3">{r.metric_name}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">
                          {Number(r.value)} {r.unit}
                        </td>
                        <td className="py-1.5 pr-3">{r.method}</td>
                        <td className="py-1.5 pr-3 font-mono text-xs">{r.experiment_id ?? "—"}</td>
                        <td className="py-1.5 text-xs opacity-70">{r.operator_note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
