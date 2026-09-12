import DataStateBadge from "@/components/DataStateBadge";
import { db } from "@/lib/db";
import { ageLabel, stateForValue } from "@/lib/states";

// S21 scaffold of the Live Status page. Honest by construction: values come
// only from stored telemetry; when the database or a channel has no data the
// badge says so (MISSING / OPTIONAL_ABSENT). Full live UI lands in S24.

export const dynamic = "force-dynamic";

type LatestRow = {
  recorded_at: Date | string;
  temperature_c: number | null;
  ph: number | null;
  light_relative_pct: number | null;
  water_level_state: string | null;
} | null;

async function probe(): Promise<{ row: LatestRow; database: "connected" | "unavailable" | "not_configured" }> {
  if (!process.env.DATABASE_URL) return { row: null, database: "not_configured" };
  try {
    const r = await db().query(
      "SELECT recorded_at, temperature_c, ph, light_relative_pct, water_level_state FROM telemetry_readings ORDER BY recorded_at DESC LIMIT 1",
    );
    return { row: (r.rows[0] as LatestRow) ?? null, database: "connected" };
  } catch {
    return { row: null, database: "unavailable" };
  }
}

function ChannelCard({
  label,
  value,
  state,
  age,
  hint,
}: {
  label: string;
  value: string | null;
  state: ReturnType<typeof stateForValue>;
  age: number | null;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm opacity-70">{label}</span>
        <DataStateBadge state={state} age={ageLabel(age)} />
      </div>
      <div className="mt-2 text-2xl font-semibold">
        {value ?? <span className="text-base font-normal opacity-50">—</span>}
      </div>
      {hint && <div className="mt-1 text-xs opacity-50">{hint}</div>}
    </div>
  );
}

export default async function Home() {
  const { row, database } = await probe();
  const age =
    row?.recorded_at != null
      ? (Date.now() - new Date(row.recorded_at).getTime()) / 1000
      : null;

  const dbBadge =
    database === "connected"
      ? { text: "database connected", cls: "bg-emerald-100 text-emerald-900" }
      : database === "not_configured"
        ? { text: "database not configured (see .env.example)", cls: "bg-zinc-100 text-zinc-700" }
        : { text: "database unavailable", cls: "bg-amber-100 text-amber-900" };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Live Status</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${dbBadge.cls}`}>
          {dbBadge.text} · <a className="underline" href="/api/health">/api/health</a>
        </span>
      </div>
      <p className="mt-2 text-sm opacity-70">
        No value is ever fabricated: a channel without stored data shows its
        honest state badge instead.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChannelCard
          label="Temperature (DS18B20)"
          value={row?.temperature_c != null ? `${Number(row.temperature_c).toFixed(2)} °C` : null}
          state={stateForValue(row?.temperature_c, age)}
          age={age}
        />
        <ChannelCard
          label="pH (SEN0161-V2)"
          value={row?.ph != null ? Number(row.ph).toFixed(2) : null}
          state={stateForValue(row?.ph, age)}
          age={age}
        />
        <ChannelCard
          label="Relative light % (PT550)"
          value={row?.light_relative_pct != null ? `${Number(row.light_relative_pct).toFixed(1)} %` : null}
          state={stateForValue(row?.light_relative_pct, age)}
          age={age}
          hint="Relative % only — never lux/PAR/PPFD"
        />
        <ChannelCard
          label="Water level (XKC, optional)"
          value={
            row == null
              ? null
              : row.water_level_state == null
                ? null
                : `state ${row.water_level_state} (raw)`
          }
          state={stateForValue(row?.water_level_state, age, { optional: row != null })}
          age={age}
          hint="Optional sensor — absent hardware is a valid state"
        />
      </div>
    </>
  );
}
