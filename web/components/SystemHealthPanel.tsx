"use client";

import { useEffect, useState } from "react";
import DataStateBadge from "@/components/DataStateBadge";
import { ageLabel, type DataState } from "@/lib/states";

// S24 /system panel: application + ingestion + per-device health. Polls three
// secret-free server endpoints:
//   /api/health            -> app/database status (contract shape)
//   /api/system/stats      -> per-process ingestion counters (aggregate only)
//   /api/telemetry/latest  -> per-device last-seen
// Tokens, DATABASE_URL and Wi-Fi configuration never reach this page: the
// endpoints expose statuses and counts, and error strings are scrubbed
// server-side. Nothing here is fabricated - unreachable sources render as
// "unavailable", never as fake-green.

const POLL_MS = 15_000;

type Health = {
  status: "ok" | "degraded";
  database: "up" | "down";
  version: string;
  detail?: string;
  checked_at?: string;
};

type Stats = {
  server: { started_at: string; uptime_s: number };
  ingestion: {
    requests: number;
    rows_accepted: number;
    rows_rejected: number;
    by_status: Record<string, number>;
    errors_by_reason: Record<string, number>;
    last_accepted_at: string | null;
    last_error_at: string | null;
  };
  scope: string;
};

type Device = {
  device_id: string;
  received_at: string;
  timestamp_ms: number | null;
  age_s: number;
  state: DataState;
};

type PanelState = {
  health: Health | { error: string } | null;
  stats: Stats | { error: string } | null;
  devices: Device[] | { error: string } | null;
};

async function getJson<T>(url: string): Promise<T | { error: string }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const body = (await res.json()) as T & { error?: string };
    if (!res.ok) return { error: body?.error ?? `status ${res.status}` };
    return body;
  } catch {
    return { error: "unreachable" };
  }
}

function isError<T>(v: T | { error: string } | null): v is { error: string } {
  return v != null && typeof v === "object" && "error" in v;
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-semibold opacity-80">{title}</h2>
      {note && <p className="mt-1 text-xs opacity-50">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-1 text-sm last:border-0 dark:border-zinc-800">
      <span className="opacity-60">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

export default function SystemHealthPanel() {
  const [panel, setPanel] = useState<PanelState>({ health: null, stats: null, devices: null });

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const [health, stats, latest] = await Promise.all([
        getJson<Health>("/api/health"),
        getJson<Stats>("/api/system/stats"),
        getJson<{ devices: Device[] }>("/api/telemetry/latest"),
      ]);
      if (!alive) return;
      setPanel({
        health,
        stats,
        devices: isError(latest) ? latest : (latest.devices ?? []),
      });
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const { health, stats, devices } = panel;

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Card title="Application health" note="Source: GET /api/health (contract shape)">
        {health == null ? (
          <p className="text-sm opacity-60">Loading…</p>
        ) : isError(health) ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            health endpoint unavailable ({health.error}) - status unknown, not assumed ok
          </p>
        ) : (
          <>
            <KV k="status" v={health.status} />
            <KV k="database" v={health.database} />
            <KV k="version" v={health.version} />
            {health.checked_at && <KV k="checked at" v={new Date(health.checked_at).toLocaleString()} />}
            {health.detail && <KV k="detail (scrubbed)" v={health.detail} />}
          </>
        )}
      </Card>

      <Card
        title="Ingestion (this server process)"
        note={isError(stats) ? undefined : stats?.scope}
      >
        {stats == null ? (
          <p className="text-sm opacity-60">Loading…</p>
        ) : isError(stats) ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            stats endpoint unavailable ({stats.error}) - counts unknown, not assumed zero
          </p>
        ) : (
          <>
            <KV k="requests" v={stats.ingestion.requests} />
            <KV k="rows accepted" v={stats.ingestion.rows_accepted} />
            <KV k="rows rejected" v={stats.ingestion.rows_rejected} />
            <KV
              k="by HTTP status"
              v={
                Object.keys(stats.ingestion.by_status).length === 0
                  ? "none yet"
                  : Object.entries(stats.ingestion.by_status)
                      .map(([s, n]) => `${s}: ${n}`)
                      .join(", ")
              }
            />
            <KV
              k="errors by reason"
              v={
                Object.keys(stats.ingestion.errors_by_reason).length === 0
                  ? "none yet"
                  : Object.entries(stats.ingestion.errors_by_reason)
                      .map(([r, n]) => `${r}: ${n}`)
                      .join(", ")
              }
            />
            <KV k="last accepted" v={stats.ingestion.last_accepted_at ?? "never"} />
            <KV k="last error" v={stats.ingestion.last_error_at ?? "never"} />
            <KV k="web process uptime" v={`${Math.round(stats.server.uptime_s / 60)} min`} />
          </>
        )}
      </Card>

      <Card
        title="Devices (last seen)"
        note="Source: GET /api/telemetry/latest - newest stored reading per device"
      >
        {devices == null ? (
          <p className="text-sm opacity-60">Loading…</p>
        ) : isError(devices) ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            device data unavailable ({devices.error}) - last-seen unknown, never guessed
          </p>
        ) : devices.length === 0 ? (
          <p className="text-sm opacity-60">
            No device has posted telemetry yet. Provisioned devices appear here after their first
            accepted batch.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs opacity-60 dark:border-zinc-700">
                <th className="py-1 pr-2">device</th>
                <th className="py-1 pr-2">last seen</th>
                <th className="py-1 pr-2">age</th>
                <th className="py-1">state</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.device_id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                  <td className="py-1.5 pr-2 font-mono">{d.device_id}</td>
                  <td className="py-1.5 pr-2">{new Date(d.received_at).toLocaleString()}</td>
                  <td className="py-1.5 pr-2">{ageLabel(d.age_s)}</td>
                  <td className="py-1.5">
                    <DataStateBadge state={d.state} age={ageLabel(d.age_s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Security posture" note="Standing guarantees for this page">
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-80">
          <li>No secrets are rendered here: ingest tokens, database credentials and Wi-Fi configuration never reach the browser.</li>
          <li>Ingestion requires a timing-safe token comparison; failures are counted above, bodies are never echoed.</li>
          <li>Error details shown anywhere are credential-scrubbed server-side.</li>
          <li>Monitoring only: this facade never issues control commands and never displays absent sensors.</li>
        </ul>
      </Card>
    </div>
  );
}
