"use client";

import { useCallback, useEffect, useState } from "react";

// S26 Reports panel: bounded AI reports per the FROZEN docs/prompt_boundary.md.
//  - the list mirrors the reports table via GET /api/reports (content shown
//    VERBATIM as stored markdown text - [REQUIRES HUMAN CONFIRMATION] markers
//    and the boundary statement preserved exactly; never rendered as HTML);
//  - generation POSTs {from,to} to /api/reports/generate; every failure mode
//    is surfaced honestly (not-configured 503, DB down 503, provider failure
//    502, boundary violation 422 = DISCARDED and never stored, rate limit
//    429) - the UI never fabricates a report;
//  - provider config (AI_API_KEY etc.) is server-side only; this client never
//    sees or sends credentials;
//  - nothing here auto-executes: reports are text for human review.

type ReportRow = {
  id: number;
  report_date: string;
  report_type: string;
  source_window_start: string | null;
  source_window_end: string | null;
  content_markdown: string;
  created_at: string;
};

type Notice = {
  kind: "saved" | "error" | "discarded" | "db_down" | "not_configured" | "rate_limited";
  text: string;
} | null;

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const NOTICE_STYLES: Record<Exclude<Notice, null>["kind"], string> = {
  saved: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
  error: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
  discarded: "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100",
  db_down: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
  not_configured: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
  rate_limited: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
};

export default function ReportsPanel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [listNotice, setListNotice] = useState<Notice>(null);
  const [loadingList, setLoadingList] = useState(false);

  // Default generation window = last 24 h, filled on mount (client-only to
  // avoid SSR hydration drift).
  useEffect(() => {
    const now = new Date();
    setTo(toLocalInput(now));
    setFrom(toLocalInput(new Date(now.getTime() - 86_400_000)));
  }, []);

  const loadReports = useCallback(async () => {
    setLoadingList(true);
    setListNotice(null);
    try {
      const res = await fetch("/api/reports?limit=50", { cache: "no-store" });
      const body = await res.json();
      if (res.status === 503) {
        setListNotice({
          kind: "db_down",
          text: "Database unavailable — no stored reports can be read. Nothing is cached or simulated.",
        });
        setLoadingList(false);
        return;
      }
      if (!res.ok) {
        setListNotice({ kind: "error", text: String(body?.error ?? `status ${res.status}`) });
        setLoadingList(false);
        return;
      }
      setReports((body.reports ?? []) as ReportRow[]);
    } catch {
      setListNotice({ kind: "error", text: "API unreachable — is the web server running?" });
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const generate = useCallback(async () => {
    if (!from || !to) {
      setNotice({ kind: "error", text: "Set a valid window (from/to) before generating." });
      return;
    }
    const f = new Date(from);
    const t = new Date(to);
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime()) || t.getTime() < f.getTime()) {
      setNotice({ kind: "error", text: "Invalid window: to must be ≥ from." });
      return;
    }
    setGenerating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: f.toISOString(), to: t.toISOString() }),
      });
      const body = await res.json();
      if (res.ok) {
        const by = body?.provenance?.generated_by;
        setNotice({
          kind: "saved",
          text:
            by === "no-data-shortcut"
              ? "No telemetry in window — an honest 'no data' report was stored WITHOUT calling the provider."
              : "Bounded report generated, guarded, and stored (confirmation markers preserved).",
        });
        loadReports();
      } else if (res.status === 422) {
        setNotice({
          kind: "discarded",
          text: `Report DISCARDED by the output boundary (forbidden claim: "${String(body?.term ?? "?")}"). Nothing was stored. Offending line: ${String(body?.line ?? "")}`,
        });
      } else if (res.status === 429) {
        setNotice({
          kind: "rate_limited",
          text: `Rate limited — generation is capped at 5/min/server. Retry in ${String(body?.retry_after_s ?? "?")} s.`,
        });
      } else if (res.status === 503 && String(body?.error ?? "").includes("not configured")) {
        setNotice({
          kind: "not_configured",
          text: "AI report generation is NOT configured on this server (provider env is server-side only — see web/README.md). No report was generated or fabricated.",
        });
      } else if (res.status === 503) {
        setNotice({
          kind: "db_down",
          text: String(body?.error ?? "database unavailable") + " — report NOT generated.",
        });
      } else {
        setNotice({
          kind: "error",
          text: `${String(body?.error ?? `status ${res.status}`)}${body?.detail ? ` (${String(body.detail)})` : ""}`,
        });
      }
    } catch {
      setNotice({ kind: "error", text: "API unreachable — is the web server running?" });
    }
    setGenerating(false);
  }, [from, to, loadReports]);

  return (
    <div className="mt-6">
      {/* generation (bounded agent per docs/prompt_boundary.md) */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <label className="text-xs opacity-70">
          window from
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
          />
        </label>
        <label className="text-xs opacity-70">
          to
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
          />
        </label>
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {generating ? "Generating…" : "Generate bounded report"}
        </button>
        <span className="text-[11px] opacity-50">
          max 7-day window · provider runs server-side only · output is guarded before storage
        </span>
      </div>

      {notice && (
        <div className={`mt-4 rounded-xl border p-4 text-sm ${NOTICE_STYLES[notice.kind]}`}>
          {notice.text}
        </div>
      )}

      {/* stored reports list */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">Stored reports</h2>
        <button
          type="button"
          onClick={loadReports}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      {listNotice && (
        <div className={`mt-3 rounded-xl border p-4 text-sm ${NOTICE_STYLES[listNotice.kind]}`}>
          {listNotice.text}
        </div>
      )}

      <div className={loadingList ? "mt-4 opacity-50 transition-opacity" : "mt-4 transition-opacity"}>
        {reports == null && !loadingList && !listNotice ? (
          <p className="text-sm opacity-60">Loading reports…</p>
        ) : reports != null && reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="font-medium">No reports stored yet</p>
            <p className="mt-2 text-sm opacity-70">
              Reports appear here only from the bounded agent pipeline (or honest no-data reports).
              Nothing is simulated or back-filled.
            </p>
          </div>
        ) : reports != null ? (
          <div className="grid gap-4">
            {reports.map((r) => (
              <article key={r.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <header className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-semibold">{r.report_date}</span>
                  <span className="rounded-md border border-zinc-300 px-2 py-0.5 font-mono dark:border-zinc-700">
                    {r.report_type}
                  </span>
                  <span className="opacity-60">
                    generated at {new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19)} UTC
                  </span>
                  {r.source_window_start && r.source_window_end && (
                    <span className="opacity-60">
                      window {new Date(r.source_window_start).toISOString().slice(0, 16)} →{" "}
                      {new Date(r.source_window_end).toISOString().slice(0, 16)} UTC
                    </span>
                  )}
                </header>
                <p className="mt-1 text-[11px] opacity-50">
                  Provenance: bounded agent per docs/prompt_boundary.md — restate-only, deterministic
                  recommendations with [REQUIRES HUMAN CONFIRMATION] markers, nothing auto-executed.
                </p>
                {/* stored markdown shown VERBATIM as text: markers preserved exactly,
                    never rendered as HTML (no dangerouslySetInnerHTML) */}
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-sans text-sm leading-relaxed dark:bg-zinc-900">
                  {r.content_markdown}
                </pre>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
