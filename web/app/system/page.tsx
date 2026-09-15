import SystemHealthPanel from "@/components/SystemHealthPanel";

// S24: System Health page - application/database status, per-process
// ingestion error counts and per-device last-seen. Secret-free by
// construction: the polled endpoints expose statuses and aggregates only.

export const metadata = { title: "System Health — Smart Tank" };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-bold">System Health</h1>
      <p className="mt-2 text-sm opacity-70">
        Application health, ingestion error counts (per server process — resets on restart) and
        per-device last-seen. No secrets are rendered on this page: tokens, database credentials
        and Wi-Fi configuration never reach the browser.
      </p>
      <SystemHealthPanel />
    </>
  );
}
