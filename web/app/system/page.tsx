import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata = { title: "System Health — Smart Tank" };

export default function Page() {
  return (
    <PlaceholderPage
      title="System Health"
      session="S24 (live status and device health UI)"
      description="Device and sensor health: last-seen time, uptime, ingestion errors. The optional XKC water-level sensor shows “not installed” when its state is null — an absent optional sensor is a valid, fully supported state."
      emptyState="No device health data is displayed yet. Application/database health is already queryable at /api/health; device-level health (last seen, RSSI, firmware, ingestion errors) renders here once telemetry flows."
    />
  );
}
