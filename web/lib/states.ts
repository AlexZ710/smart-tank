// Frozen data-state semantics (docs/Web_Facade_Architecture.md, S19/S21).
// The facade must distinguish all six states. UNAVAILABLE (ORP, EC/conductivity,
// ZP4510 float, FS300A flow) is deliberately NOT a renderable state: those
// sensors are absent from the hardware baseline and must never exist as
// fields, cards, mocks, rules or claims anywhere.

export type DataState =
  | "CURRENT"          // last valid reading age <= STALE_AFTER_S
  | "STALE"            // last reading older than STALE_AFTER_S
  | "MISSING"          // channel never received a reading -> "no data yet"
  | "OPTIONAL_ABSENT"  // optional XKC-Y25-T12V reports null -> "not installed"
  | "MANUAL";          // salinity/ammonia from manual_measurements

export const STALE_AFTER_S = Number(process.env.STALE_AFTER_S ?? 180);

export const STATE_LABELS: Record<DataState, string> = {
  CURRENT: "current",
  STALE: "stale",
  MISSING: "no data yet",
  OPTIONAL_ABSENT: "not installed",
  MANUAL: "manual",
};

/**
 * Derive the honest state for one channel.
 *
 * @param value       stored value, or null/undefined when never measured
 * @param ageSeconds  age of that value in seconds, or null when unknown
 * @param optional    true only for the optional XKC water-level channel:
 *                    a stored null then means OPTIONAL_ABSENT, not MISSING
 */
export function stateForValue(
  value: number | string | null | undefined,
  ageSeconds: number | null,
  opts: { optional?: boolean } = {},
): DataState {
  if (value === null || value === undefined) {
    return opts.optional ? "OPTIONAL_ABSENT" : "MISSING";
  }
  if (ageSeconds === null || Number.isNaN(ageSeconds)) return "MISSING";
  return ageSeconds <= STALE_AFTER_S ? "CURRENT" : "STALE";
}

/** Format an age for badge tooltips; never invents a value. */
export function ageLabel(ageSeconds: number | null): string {
  if (ageSeconds === null || Number.isNaN(ageSeconds)) return "age unknown";
  if (ageSeconds < 60) return `${Math.round(ageSeconds)} s old`;
  if (ageSeconds < 3600) return `${Math.round(ageSeconds / 60)} min old`;
  return `${(ageSeconds / 3600).toFixed(1)} h old`;
}
