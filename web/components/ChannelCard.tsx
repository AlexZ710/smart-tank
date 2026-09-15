import DataStateBadge from "@/components/DataStateBadge";
import type { DataState } from "@/lib/states";

// S24: one sensor channel card for the Live Status page.
// A STALE channel is dimmed (acceptance: "stale dimmed with age") and its
// badge carries the age. A value is rendered only when stored data exists -
// null shows the em-dash plus the honest state badge ("no data yet" /
// "not installed"), never zero, never a placeholder number.

export default function ChannelCard({
  label,
  value,
  state,
  age,
  hint,
}: {
  label: string;
  value: string | null;
  state: DataState;
  age: string | null;
  hint?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 ${
        state === "STALE" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm opacity-70">{label}</span>
        <DataStateBadge state={state} age={age ?? undefined} />
      </div>
      <div className="mt-2 text-2xl font-semibold">
        {value ?? <span className="text-base font-normal opacity-50">—</span>}
      </div>
      {hint && <div className="mt-1 text-xs opacity-50">{hint}</div>}
    </div>
  );
}
