import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata = { title: "Events — Smart Tank" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Events"
      session="S26 (events and AI report UI)"
      description="Rule-engine events and alerts. Events come from the deterministic engine only (S11 rule codes: TEMP_* / PH_*); nothing here is model-invented."
      emptyState="No events are displayed yet. When the rule engine output is stored, warning/critical events will be listed here with their deterministic rule codes and reasons."
    />
  );
}
