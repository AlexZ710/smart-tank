# Web Facade Architecture

## Stack
- Next.js App Router.
- Tailwind CSS.
- Next.js Route Handlers for ingestion/read APIs.
- PostgreSQL via `DATABASE_URL`.
- Local PostgreSQL in Docker Desktop.
- Vercel deployment for final web application.

## Required pages
- `/` overview/live status.
- `/history` historical charts and ranges.
- `/events` rule-engine events/alerts.
- `/experiments` experiment timeline/markers.
- `/reports` AI daily/experiment reports.
- `/system` device and sensor health.

## Required API surface
- `POST /api/telemetry` - authenticated ESP32 ingestion.
- `GET /api/telemetry/latest` - latest reading.
- `GET /api/telemetry/history` - bounded historical query.
- `GET /api/events` - events.
- `GET /api/reports` - reports.
- `GET /api/health` - application/database health.

## Device provisioning boundary
The final dashboard does not contain the user's Wi-Fi password.

Wi-Fi configuration happens locally on the ESP32 through first-boot/recovery SoftAP provisioning:
`01_Project_Documentation/WiFi_Provisioning_Architecture.md`.

After provisioning, the ESP32 uses station mode and makes outbound requests to the API.

## Security
- Device ingestion requires a secret token stored server-side in deployment environment and device-side in local NVS configuration.
- Never expose Wi-Fi credentials, device token, or database credentials to browser-side code.
- Never commit real Wi-Fi credentials or device ingest tokens to the repository.
- Validate JSON shape and ranges before database insert.
- Rate-limit or otherwise protect ingestion before public demonstration.
