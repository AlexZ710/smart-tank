import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata = { title: "History — Smart Tank" };

export default function Page() {
  return (
    <PlaceholderPage
      title="History"
      session="S25 (history charts and experiment markers)"
      description="Historical charts and ranges, plotting stored readings only. Gaps render as gaps — missing samples are never interpolated or zero-filled."
      emptyState="No historical readings are displayed yet. Once telemetry is stored (S22 ingestion + device data), charts of temperature, pH and relative light will appear here."
    />
  );
}
