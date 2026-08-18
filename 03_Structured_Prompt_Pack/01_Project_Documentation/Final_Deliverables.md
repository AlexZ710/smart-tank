# Final Deliverables - smart-tank

## Hardware/firmware
- working ESP32-S3 sensing system;
- standalone sensor serial sketches;
- integrated firmware;
- detailed wiring pack;
- first-boot Wi-Fi provisioning using local SoftAP + captive portal;
- NVS-persisted Wi-Fi/device configuration;
- documented re-provisioning and factory-reset path;
- authenticated Wi-Fi telemetry firmware path.

## Web/software
- responsive Next.js/Tailwind facade;
- authenticated telemetry ingestion;
- PostgreSQL storage;
- latest status, history, events, experiments, AI reports, and system-health views;
- local Docker/PostgreSQL development path;
- Vercel deployment documentation.

## Research/engineering evidence
- raw and clean data;
- rule events;
- experiment logs/figures;
- manual salinity records where applicable;
- calibration and wiring evidence;
- provisioning evidence: first boot, reconnect, fallback portal, and reset/re-provision.

## Publication
- GitHub repository;
- final technical report;
- reproducibility instructions;
- 2-3 minute demo script showing first-boot/recovery provisioning briefly, then hardware -> Wi-Fi -> web -> data -> events/report.

## Security acceptance
The final repository must contain no real Wi-Fi SSID/password, no device ingest secret, and no database password in tracked source files.
