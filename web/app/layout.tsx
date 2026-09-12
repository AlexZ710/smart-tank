import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Smart Tank — 5 L monitoring-only reef tank",
  description:
    "Observation dashboard for an ESP32-S3 monitored 5 L reef tank. Monitoring only: no dosing, no mains control.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <SiteHeader />
        <main className="mx-auto max-w-6xl p-4">{children}</main>
        <footer className="mx-auto max-w-6xl p-4 text-xs opacity-60">
          Monitoring only — recommendations are observational and always marked
          [REQUIRES HUMAN CONFIRMATION]. Absent sensors (ORP, EC/conductivity,
          ZP4510 float, FS300A flow) are never displayed. Light is relative %
          (PT550), never lux/PAR/PPFD. Salinity/ammonia are manual entries only.
        </footer>
      </body>
    </html>
  );
}
