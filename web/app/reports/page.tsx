import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata = { title: "Reports — Smart Tank" };

export default function Page() {
  return (
    <PlaceholderPage
      title="Reports"
      session="S26 (events and AI report UI)"
      description="Bounded AI reports per docs/prompt_boundary.md: observation and verification suggestions only — never dosing or mains-control actions. Every recommendation keeps its [REQUIRES HUMAN CONFIRMATION] marker verbatim."
      emptyState="No reports are displayed yet. Reports will appear here only from the bounded agent pipeline, with their human-confirmation markers preserved exactly as generated."
    />
  );
}
