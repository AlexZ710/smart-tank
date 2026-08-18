export type Telemetry = {
  device_id: string; recorded_at: string; temperature_c: number | null; ph: number | null;
  light_raw: number | null; light_voltage_v: number | null; water_level_state?: string | null;
  wifi_rssi_dbm?: number | null; firmware_version: string; experiment_id?: string | null;
};
export function parseTelemetry(x: unknown): Telemetry {
  if (!x || typeof x !== "object") throw new Error("JSON body required");
  const v = x as Record<string, unknown>;
  if (typeof v.device_id !== "string" || typeof v.recorded_at !== "string" || typeof v.firmware_version !== "string") throw new Error("Missing device_id, recorded_at, or firmware_version");
  const num = (k:string) => v[k] === null || v[k] === undefined ? null : (typeof v[k] === "number" && Number.isFinite(v[k]) ? v[k] as number : (()=>{throw new Error(`Invalid ${k}`)})());
  const ph = num("ph"); if (ph !== null && (ph < 0 || ph > 14)) throw new Error("pH out of range");
  const temperature_c = num("temperature_c"); if (temperature_c !== null && (temperature_c < -20 || temperature_c > 80)) throw new Error("temperature out of engineering range");
  return {device_id:v.device_id, recorded_at:v.recorded_at, firmware_version:v.firmware_version, temperature_c, ph, light_raw:num("light_raw"), light_voltage_v:num("light_voltage_v"), water_level_state:typeof v.water_level_state === "string"?v.water_level_state:null, wifi_rssi_dbm:num("wifi_rssi_dbm"), experiment_id:typeof v.experiment_id === "string"?v.experiment_id:null};
}
