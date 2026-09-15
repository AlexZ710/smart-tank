import LiveStatusPanel from "@/components/LiveStatusPanel";

// S24: Live Status page. All values come from stored telemetry via
// GET /api/telemetry/latest (S22), polled by the client panel with the frozen
// six-state badges. No value is ever fabricated: an empty database renders
// "no telemetry received yet"; a down database renders an honest notice.
// The optional XKC channel shows "not installed" when null and the page is
// fully functional without it.

export const metadata = { title: "Live Status — Smart Tank" };

export default function Home() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Live Status</h1>
        <span className="text-xs opacity-60">
          auto-refresh every 15 s ·{" "}
          <a className="underline" href="/system">
            device health
          </a>
        </span>
      </div>
      <p className="mt-2 text-sm opacity-70">
        Latest stored reading per device. Stale channels are dimmed with their age; channels
        without data say &ldquo;no data yet&rdquo;; the optional XKC water-level sensor shows
        &ldquo;not installed&rdquo; when absent — the page works fully without it.
      </p>
      <LiveStatusPanel />
    </>
  );
}
