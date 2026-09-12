// S22: request validation for POST /api/telemetry, implementing the FROZEN
// docs/Telemetry_Contract.md (S19) exactly:
//  - per-field nullable ranges identical to backend/collector/clean_data.py
//    (-10..85 temperature, 0..14 pH, 0..100 relative light; voltages 0..5);
//    changing a range requires updating the contract, the cleaner and the
//    tests in ONE commit.
//  - forbidden fields (absent hardware: ORP, EC/conductivity, flow,
//    ZP4510/FS300A float, lux/PAR/PPFD units, auto-dosing, plus the
//    manual-only salinity/ammonia metrics) reject the WHOLE request with 400.
//  - null means "not measured" and is stored as NULL; a MISSING key is a
//    row rejection - values are never defaulted or substituted.
//  - unknown extra fields on a reading are ignored (forward compatibility).
//  - batches are capped at 500 readings (413 above).
//
// Erasable-syntax-only TypeScript so `node --test` can run these modules
// directly without a build step.

export const MAX_BATCH = 500;
export const MAX_DEVICE_ID_LEN = 64;
export const FIRMWARE_UNKNOWN = "unknown"; // honest marker when device sends none

export const CHANNEL_RANGES = {
  temperature_c: [-10, 85],
  ph: [0, 14],
  ph_voltage_v: [0, 5], // validated per contract; not stored (CSV-pipeline only)
  light_relative_pct: [0, 100],
  light_voltage_v: [0, 5],
} as const;

// Keys are matched raw AND normalized (separators -> spaces) because \b does
// not fire between a letter and an underscore: "orp_mv" would slip past
// /\borp\b/ without normalization.
const FORBIDDEN_KEY_PATTERNS: Array<[RegExp, string]> = [
  [/\borp\b/i, "ORP sensor absent from hardware baseline"],
  [/conductivity|\bec\b/i, "EC/conductivity sensor absent from hardware baseline"],
  [/\bflow\b|zp4510|fs300a|float/i, "flow/float sensors (ZP4510/FS300A) absent from hardware baseline"],
  [/\blux\b|\bpar\b|ppfd/i, "light is relative % only - lux/PAR/PPFD claims forbidden"],
  [/dosing|\bdose\b/i, "auto-dosing forbidden - monitoring only"],
  [/salinity|ammonia/i, "manual-only measurements - never accepted via device ingestion"],
];

export type IngestRow = {
  timestamp_ms: number;
  temperature_c: number | null;
  ph: number | null;
  light_relative_pct: number | null;
  light_voltage_v: number | null;
  xkc_level_state: 0 | 1 | null;
  firmware_version: string;
};

export type Rejection = { index: number; error: string };

export type ParseResult =
  | { status: 200; device_id: string; rows: IngestRow[]; rejected: Rejection[] }
  | { status: 400 | 413; error: string };

/** First forbidden key found in an object's own keys, or null. */
export function findForbiddenKey(obj: Record<string, unknown>): string | null {
  for (const key of Object.keys(obj)) {
    const norm = key.replace(/[_\-\s.]+/g, " ");
    for (const [re, why] of FORBIDDEN_KEY_PATTERNS) {
      if (re.test(key) || re.test(norm)) return `${key} (${why})`;
    }
  }
  return null;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function checkChannel(
  row: Record<string, unknown>,
  name: string,
  index: number,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (!(name in row)) {
    return { ok: false, error: `${name} missing (required key; null allowed when not measured)` };
  }
  const v = row[name];
  if (v === null) return { ok: true, value: null };
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return { ok: false, error: `${name} must be a finite number or null` };
  }
  const [lo, hi] = CHANNEL_RANGES[name as keyof typeof CHANNEL_RANGES];
  if (v < lo || v > hi) {
    return { ok: false, error: `${name}=${v} out of range ${lo}..${hi} (rejected, never clamped)` };
  }
  return { ok: true, value: v };
}

function parseRow(
  raw: unknown,
  index: number,
  defaultFirmware: string,
): { ok: true; row: IngestRow } | { ok: false; error: string } {
  if (!isPlainObject(raw)) return { ok: false, error: "reading must be a JSON object" };

  // timestamp_ms: required, integer, > 0 (device millis()).
  const ts = raw.timestamp_ms;
  if (!Number.isSafeInteger(ts) || (ts as number) <= 0) {
    return { ok: false, error: "timestamp_ms must be an integer > 0 (device millis())" };
  }

  const values: Record<string, number | null> = {};
  for (const name of Object.keys(CHANNEL_RANGES)) {
    const res = checkChannel(raw, name, index);
    if (!res.ok) return { ok: false, error: res.error };
    values[name] = res.value;
  }

  // xkc_level_state: required; 0 | 1 | null (null = optional sensor absent).
  if (!("xkc_level_state" in raw)) {
    return { ok: false, error: "xkc_level_state missing (required key; null = sensor absent)" };
  }
  const xkc = raw.xkc_level_state;
  if (xkc !== null && xkc !== 0 && xkc !== 1) {
    return { ok: false, error: `xkc_level_state must be 0, 1 or null (got ${JSON.stringify(xkc)})` };
  }

  // Optional per-row firmware_version (schema column is NOT NULL; the server
  // stores the honest marker "unknown" when the device sends none).
  let firmware = defaultFirmware;
  if (raw.firmware_version !== undefined) {
    if (typeof raw.firmware_version !== "string" || raw.firmware_version.length === 0 || raw.firmware_version.length > MAX_DEVICE_ID_LEN) {
      return { ok: false, error: "firmware_version, when present, must be a non-empty string <= 64 chars" };
    }
    firmware = raw.firmware_version;
  }

  return {
    ok: true,
    row: {
      timestamp_ms: ts as number,
      temperature_c: values.temperature_c,
      ph: values.ph,
      light_relative_pct: values.light_relative_pct,
      light_voltage_v: values.light_voltage_v,
      xkc_level_state: xkc as 0 | 1 | null,
      firmware_version: firmware,
      // ph_voltage_v validated above, intentionally not stored:
      // database/README.md contract mapping keeps it in the CSV pipeline only.
    },
  };
}

/** Validate a full POST /api/telemetry body per the frozen contract. */
export function parseIngestPayload(body: unknown): ParseResult {
  if (!isPlainObject(body)) return { status: 400, error: "JSON object body required" };

  const forbidden = findForbiddenKey(body);
  if (forbidden) return { status: 400, error: `forbidden field: ${forbidden}` };

  const deviceId = body.device_id;
  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    return { status: 400, error: "device_id must be a non-empty string" };
  }
  if (deviceId.length > MAX_DEVICE_ID_LEN) {
    return { status: 400, error: `device_id exceeds ${MAX_DEVICE_ID_LEN} chars` };
  }

  if (!Array.isArray(body.readings)) {
    return { status: 400, error: "readings must be an array" };
  }
  if (body.readings.length > MAX_BATCH) {
    return { status: 413, error: `batch too large: ${body.readings.length} > ${MAX_BATCH} readings max` };
  }

  let defaultFirmware = FIRMWARE_UNKNOWN;
  if (body.firmware_version !== undefined) {
    if (typeof body.firmware_version !== "string" || body.firmware_version.length === 0 || body.firmware_version.length > MAX_DEVICE_ID_LEN) {
      return { status: 400, error: "firmware_version, when present, must be a non-empty string <= 64 chars" };
    }
    defaultFirmware = body.firmware_version;
  }

  const rows: IngestRow[] = [];
  const rejected: Rejection[] = [];
  for (let index = 0; index < body.readings.length; index++) {
    const raw = body.readings[index];
    // Forbidden fields reject the WHOLE request (contract), not just the row.
    if (isPlainObject(raw)) {
      const bad = findForbiddenKey(raw);
      if (bad) return { status: 400, error: `forbidden field: ${bad}` };
    }
    const res = parseRow(raw, index, defaultFirmware);
    if (res.ok) rows.push(res.row);
    else rejected.push({ index, error: res.error });
  }

  return { status: 200, device_id: deviceId, rows, rejected };
}
