# EXP06 - Provisioning, Wi-Fi and Web Telemetry Reliability

## Purpose
Verify both the deployability of the device and the final no-USB telemetry path.

## Part A - provisioning lifecycle
Record:
1. empty-NVS first boot;
2. local SoftAP creation;
3. captive portal access at `192.168.4.1`;
4. save + reboot;
5. automatic station connection;
6. deliberate saved-network failure or temporary use of an unavailable SSID;
7. provisioning fallback;
8. `PROVISION` recovery;
9. `CLEAR_WIFI` factory reset;
10. secret scan confirming no real Wi-Fi password/device token is tracked.

## Part B - telemetry reliability
- Run the integrated ESP32 firmware on provisioned Wi-Fi.
- Record a fixed observation window.
- Compare local Serial timestamps with database rows.
- Introduce a short Wi-Fi outage or endpoint outage if safe.
- Observe recovery behavior and missing-data handling.
- Confirm the device does not erase credentials during ordinary Wi-Fi loss.

## Required evidence
- first-boot Serial excerpt;
- captive-portal screenshot;
- reconnect/fallback/reset evidence;
- provisioning source-policy validation result;
- firmware telemetry log excerpt;
- API/database row counts;
- dashboard screenshot;
- outage/recovery timeline;
- calculated delivery success rate;
- explanation of duplicates/missing rows if present.

## Acceptance
- Wi-Fi changes do not require a firmware recompile.
- The UI never invents data during outages.
- The device clearly distinguishes provisioning/offline/configuration-needed/connected states.
- No submitted password/token appears in Serial output, tracked source, or browser dashboard.
