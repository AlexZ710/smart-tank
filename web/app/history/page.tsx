import HistoryPanel from "@/components/HistoryPanel";

// S25: History page - bounded range queries against GET /api/telemetry/history
// with small-multiple SVG charts (temperature, pH, relative light %).
// Stored rows only: gaps render as line breaks, NULLs are skipped (never
// zero-filled), truncation at the row limit is stated, and nothing is
// interpolated or simulated - in the charts or in the empty states.

export const metadata = { title: "History — Smart Tank" };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-bold">History</h1>
      <p className="mt-2 text-sm opacity-70">
        Bounded queries over stored readings (range presets, custom window, row limit ≤ 5000).
        Charts plot stored samples only — gaps are drawn as breaks, never interpolated; every
        chart has a table view listing its exact rows.
      </p>
      <HistoryPanel />
    </>
  );
}
