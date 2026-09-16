// S26: frozen S11 rule vocabulary + query validation for GET /api/events.
// The rule engine (backend/rules/rules.py, docs/rules_engine.md) defines
// EXACTLY these eight codes over the measured baseline channels only
// (temperature DS18B20, pH SEN0161-V2). There are deliberately NO flow,
// ORP, EC/conductivity or float-switch codes: those sensors are absent from
// the hardware baseline, so a rule_code outside this vocabulary is rejected
// with 400 - it can never be queried, rendered or invented.

export const RULE_CODES = [
  "TEMP_MISSING",
  "TEMP_INVALID",
  "TEMP_OUT_OF_RANGE",
  "TEMP_CRITICAL",
  "PH_MISSING",
  "PH_INVALID",
  "PH_OUT_OF_RANGE",
  "PH_CRITICAL",
] as const;

export type RuleCode = (typeof RULE_CODES)[number];

export const SEVERITIES = ["warning", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const MAX_EVENTS_LIMIT = 1000; // contract cap
export const DEFAULT_EVENTS_LIMIT = 200;

export function isValidRuleCode(v: string): v is RuleCode {
  return (RULE_CODES as readonly string[]).includes(v);
}

export function isValidSeverity(v: string): v is Severity {
  return (SEVERITIES as readonly string[]).includes(v);
}
