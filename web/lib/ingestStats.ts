// S24: honest in-memory ingestion statistics behind the /system health UI.
// Scope: PER SERVER PROCESS (resets on restart, per instance) - the same
// documented limitation as the rate limiter; a shared/persistent store is an
// S27 hardening item. Counters and ISO timestamps ONLY: request bodies,
// tokens, device ids and connection strings are never stored here.

export type IngestRecord = {
  status: number; // HTTP status the ingestion API returned
  reason?: string; // short honest reason key (fixed vocabulary, no free text)
  accepted?: number; // rows stored (200 responses)
  rejectedRows?: number; // rows rejected within a 200 partial success
};

export type IngestSnapshot = {
  requests: number;
  rows_accepted: number;
  rows_rejected: number;
  by_status: Record<string, number>;
  errors_by_reason: Record<string, number>;
  last_accepted_at: string | null;
  last_error_at: string | null;
};

export function createIngestStats(now: () => number = () => Date.now()) {
  let requests = 0;
  let rowsAccepted = 0;
  let rowsRejected = 0;
  const byStatus: Record<string, number> = {};
  const errorsByReason: Record<string, number> = {};
  let lastAcceptedAt: string | null = null;
  let lastErrorAt: string | null = null;

  return {
    record(e: IngestRecord): void {
      requests++;
      const key = String(e.status);
      byStatus[key] = (byStatus[key] ?? 0) + 1;
      rowsAccepted += e.accepted ?? 0;
      rowsRejected += e.rejectedRows ?? 0;
      const at = new Date(now()).toISOString();
      if (e.status >= 200 && e.status < 300) {
        lastAcceptedAt = at;
      } else {
        lastErrorAt = at;
        const reason = e.reason ?? `http_${e.status}`;
        errorsByReason[reason] = (errorsByReason[reason] ?? 0) + 1;
      }
    },

    /** Immutable copy - callers cannot corrupt the live counters. */
    snapshot(): IngestSnapshot {
      return {
        requests,
        rows_accepted: rowsAccepted,
        rows_rejected: rowsRejected,
        by_status: { ...byStatus },
        errors_by_reason: { ...errorsByReason },
        last_accepted_at: lastAcceptedAt,
        last_error_at: lastErrorAt,
      };
    },

    /** Test helper: return to the fresh zero state. */
    reset(): void {
      requests = 0;
      rowsAccepted = 0;
      rowsRejected = 0;
      for (const k of Object.keys(byStatus)) delete byStatus[k];
      for (const k of Object.keys(errorsByReason)) delete errorsByReason[k];
      lastAcceptedAt = null;
      lastErrorAt = null;
    },
  };
}

// Singleton used by POST /api/telemetry and GET /api/system/stats.
export const ingestStats = createIngestStats();
