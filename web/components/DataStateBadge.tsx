import { DataState, STATE_LABELS } from "@/lib/states";

// Renders the honest state badge for a channel. UNAVAILABLE is intentionally
// not part of DataState: absent sensors (ORP, EC/conductivity, ZP4510 float,
// FS300A flow) are never rendered as cards, fields or "unavailable" widgets.

const STYLES: Record<DataState, string> = {
  CURRENT: "bg-emerald-100 text-emerald-900 border-emerald-300",
  STALE: "bg-amber-100 text-amber-900 border-amber-300",
  MISSING: "bg-zinc-100 text-zinc-700 border-zinc-300",
  OPTIONAL_ABSENT: "bg-sky-100 text-sky-900 border-sky-300",
  MANUAL: "bg-violet-100 text-violet-900 border-violet-300",
};

export default function DataStateBadge({
  state,
  age,
}: {
  state: DataState;
  age?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[state]}`}
      title={age ?? undefined}
    >
      {STATE_LABELS[state]}
      {state === "STALE" && age ? ` (${age})` : ""}
    </span>
  );
}
