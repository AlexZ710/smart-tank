/*
 * S04 Environment Check - smart-tank
 *
 * Session 04 only: verifies the ESP32-S3 Arduino toolchain, 115200 Serial
 * output, and that the provisioning headers (WiFi, Preferences, WebServer,
 * DNSServer) compile and link. No sensors and no captive portal here.
 *
 * Policy: NO Wi-Fi credentials in source. This sketch never connects to a
 * network and reads nothing from NVS.
 */

#include <WiFi.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DNSServer.h>

// Compile-time reference only; instances are NOT created in S04.
static constexpr uint32_t SERIAL_BAUD = 115200;

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(2000);  // allow USB-CDC re-enumeration before first banner print

  Serial.println();
  Serial.println("=== smart-tank S04 Environment Check ===");
  Serial.printf("Chip: %s rev %d\r\n", ESP.getChipModel(), ESP.getChipRevision());
  Serial.printf("CPU: %d cores, %d MHz\r\n", ESP.getChipCores(), getCpuFrequencyMhz());
  Serial.printf("Flash: %u KB\r\n", ESP.getFlashChipSize() / 1024);
  Serial.printf("SDK: %s\r\n", ESP.getSdkVersion());
  Serial.printf("Arduino ESP32 core compile check: WiFi.h, Preferences.h, WebServer.h, DNSServer.h OK\r\n");
  Serial.printf("MAC: %s (device identity for future AP suffix; no credentials stored)\r\n", WiFi.macAddress().c_str());
  Serial.println("=== S04 check complete ===");
}

void loop() {
  // 5-second heartbeat proves the board is alive and Serial Monitor works.
  static uint32_t beats = 0;
  delay(5000);
  Serial.printf("[beat %lu] S04 alive\r\n", (unsigned long)(++beats));
}
