# Wi-Fi Provisioning Common Utility

This is a standalone device-configuration test, not a sensor sketch.

Use it to verify:
- first-boot SoftAP;
- captive portal;
- NVS persistence through `Preferences`;
- failed-network fallback;
- `PROVISION`;
- `CLEAR_WIFI`.

No Wi-Fi wiring is required beyond USB power/programming of the ESP32-S3. Normal sensor wiring can remain disconnected for this isolated test.

Serial Monitor: 115200 baud.
