"use client";

import { useEffect, useState, type ReactNode } from "react";
import ChannelCard from "@/components/ChannelCard";
import DataStateBadge from "@/components/DataStateBadge";
import { ageLabel, type DataState } from "@/lib/states";

// S24 Live Status panel: polls GET /api/telemetry/latest (the S22 endpoint)
// and renders every stored channel with its honest six-state badge.
//  - empty database      -> "no telemetry received yet" empty state
//  - database down (503) -> honest notice, never fabricated values
//  - STALE channels      -> dimmed card + age on the badge
//  - XKC null            -> "not installed"; the page works fully without it
// Nothing is interpolated, defaulted or invented client-side.

const POLL_MS = 15_000;

type Channel = { value: number | null; state: DataState };
type Device = {
  device_id: string;
  received_at: string;
  timestamp_ms: number | null;
  age_s: number;
  state: "CURRENT" | "STALE";
  channels: {
    temperature_c: Channel;
    ph: Channel;
    light_relative_pct: Channel;
    xkc_level_state: Channel;
  };
};

type PanelState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "db_down" }
  | { kind: "ok"; devices: Device[] };

async function load(): Promise<PanelState> {
  let res: Response;
  try {
    res = await fetch("/api/telemetry/latest", { cache: "no-store" });
  } catch {
    return { kind: "error", message: "API unreachable - is the web server running?" };
  }
  if (res.status === 503) return { kind: "db_down" };
  if (!res.ok) return { kind: "error", message: `unexpected status ${res.status} from /api/telemetry/latest` };
  try {
    const body = (await res.json()) as { devices?: Device[] };
    return { kind: "ok", devices: body.devices ?? [] };
  } catch {
    return { kind: "error", message: "malformed response from /api/telemetry/latest" };
  }
}

function fmt(v: number | null, digits: number, suffix = ""): string | null {
  return v == null ? null : `${Number(v).toFixed(digits)}${suffix}`;
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      {children}
    </div>
  );
}

export default function LiveStatusPanel() {
  const [panel, setPanel] = useState<PanelState>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    const tick = () => {
      load().then((p) => {
        if (alive) setPanel(p);
      });
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (panel.kind === "loading") {
    return <p className="mt-6 text-sm opacity-60">Loading latest telemetry…</p>;
  }
  if (panel.kind === "error") {
    return (
      <Notice>
        {panel.message} No values are shown because none could be read - nothing is fabricated.
      </Notice>
    );
  }
  if (panel.kind === "db_down") {
    return (
      <Notice>
        Database unavailable - latest values cannot be shown and ingestion is refusing writes
        (503, &ldquo;readings NOT stored&rdquo;). No data is being fabricated. See{" "}
        <a className="underline" href="/system">/system</a> for health detail.
      </Notice>
    );
  }
  if (panel.devices.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="font-medium">No telemetry received yet</p>
        <p className="mt-2 text-sm opacity-70">
          When a provisioned ESP32 posts to <code>/api/telemetry</code>, the newest reading per
          device appears here with honest state badges. Until then every channel truthfully shows
          &ldquo;no data yet&rdquo; - values are never invented.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {panel.devices.map((d) => (
        <section key={d.device_id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-sm font-semibold">{d.device_id}</h2>
            <span className="flex items-center gap-2 text-xs opacity-70">
              last seen {new Date(d.received_at).toLocaleString()} ({ageLabel(d.age_s)})
              <DataStateBadge state={d.state} age={ageLabel(d.age_s)} />
            </span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ChannelCard
              label="Temperature (DS18B20)"
              value={fmt(d.channels.temperature_c.value, 2, " °C")}
              state={d.channels.temperature_c.state}
              age={ageLabel(d.age_s)}
            />
            <ChannelCard
              label="pH (SEN0161-V2)"
              value={fmt(d.channels.ph.value, 2)}
              state={d.channels.ph.state}
              age={ageLabel(d.age_s)}
            />
            <ChannelCard
              label="Relative light % (PT550)"
              value={fmt(d.channels.light_relative_pct.value, 1, " %")}
              state={d.channels.light_relative_pct.state}
              age={ageLabel(d.age_s)}
              hint="Relative % only - never lux/PAR/PPFD"
            />
            <ChannelCard
              label="Water level (XKC, optional)"
              value={
                d.channels.xkc_level_state.value == null
                  ? null
                  : `state ${d.channels.xkc_level_state.value} (raw)`
              }
              state={d.channels.xkc_level_state.state}
              age={ageLabel(d.age_s)}
              hint={
                d.channels.xkc_level_state.state === "OPTIONAL_ABSENT"
                  ? "Not installed - absent optional hardware is a valid state; this page works fully without it"
                  : "Optional isolated XKC-Y25-T12V"
              }
            />
          </div>
        </section>
      ))}
    </div>
  );
}
