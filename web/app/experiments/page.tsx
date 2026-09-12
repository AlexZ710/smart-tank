import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata = { title: "Experiments — Smart Tank" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Experiments"
      session="S25 (history charts and experiment markers)"
      description="Experiment timeline and markers. Markers are manual records entered by the operator — they are never auto-generated. Manual salinity/ammonia entries always render labeled: manual · measured_at · method."
      emptyState="No experiments or markers are displayed yet. EXP01–EXP05 protocols are prepared (experiments/); their execution is pending hardware and a running tank."
    />
  );
}
