import ExperimentsPanel from "@/components/ExperimentsPanel";

// S25: Experiments page - timeline from the experiment_markers table plus
// manual-measurement provenance, via READ-ONLY GET /api/experiments.
// Markers are manual operator records - never auto-generated, never altered
// by the UI. Manual salinity/ammonia entries always render labeled MANUAL
// with measured_at + method.

export const metadata = { title: "Experiments — Smart Tank" };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-bold">Experiments</h1>
      <p className="mt-2 text-sm opacity-70">
        Experiment timeline and manual-operation records. Markers are manual operator entries
        (host tooling / seeded imports) — this page is read-only and never alters raw data.
        Manual-only channels (salinity, ammonia) always show the MANUAL badge with measured_at
        and method.
      </p>
      <ExperimentsPanel />
    </>
  );
}
