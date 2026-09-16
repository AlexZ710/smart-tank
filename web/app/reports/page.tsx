import ReportsPanel from "@/components/ReportsPanel";

export const metadata = { title: "Reports — Smart Tank" };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-bold">Reports</h1>
      <p className="mt-2 max-w-3xl text-sm opacity-70">
        Bounded AI reports per <span className="font-mono">docs/prompt_boundary.md</span>: the model
        restates stored observations only; recommendations come deterministically from S11 rule
        events and always keep their <span className="font-mono">[REQUIRES HUMAN CONFIRMATION]</span>{" "}
        marker; model output violating the measurement boundary is discarded, never stored; and
        nothing in a report is ever executed automatically.
      </p>
      <ReportsPanel />
    </>
  );
}
