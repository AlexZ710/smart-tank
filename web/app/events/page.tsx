import EventsPanel from "@/components/EventsPanel";

export const metadata = { title: "Events — Smart Tank" };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-bold">Events</h1>
      <p className="mt-2 max-w-3xl text-sm opacity-70">
        Deterministic rule-engine events only (S11 vocabulary: eight <span className="font-mono">TEMP_*</span>{" "}
        / <span className="font-mono">PH_*</span> codes over the measured baseline channels —
        temperature DS18B20, pH SEN0161-V2). Rows mirror the stored <span className="font-mono">events</span>{" "}
        table; nothing here is model-invented, and codes for absent sensors cannot even be queried.
      </p>
      <EventsPanel />
    </>
  );
}
