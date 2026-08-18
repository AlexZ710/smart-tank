#include <HTTPClient.h>
#include <WiFi.h>

#include "WifiProvisioning.h"

// Session 23 merges the already-validated sensor-reading functions from
// SmartTank_Integrated_Monitor.ino into this sketch.
// Wi-Fi SSID/password, endpoint URL, and device token are NOT source constants.

SmartTankProvisioning provisioning;

bool configurationReadyForTelemetry() {
  return provisioning.isConnected() &&
         !provisioning.telemetryUrl().isEmpty() &&
         !provisioning.deviceToken().isEmpty();
}

// Session 23 should call this only with real, validated sensor values.
// Keep it separate from sensor acquisition so Wi-Fi failures do not block sensing forever.
bool postTelemetryJson(const String& jsonPayload) {
  if (!configurationReadyForTelemetry()) {
    return false;
  }

  HTTPClient http;
  http.setConnectTimeout(5000);
  http.setTimeout(5000);

  if (!http.begin(provisioning.telemetryUrl())) {
    Serial.println("[HTTP] Could not initialize endpoint.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + provisioning.deviceToken());

  const int code = http.POST(jsonPayload);
  http.end();

  Serial.printf("[HTTP] POST result: %d\n", code);
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  delay(800);

  Serial.println();
  Serial.println("Smart Tank provisioned Wi-Fi telemetry scaffold");
  Serial.println("Serial commands: PROVISION | CLEAR_WIFI");

  provisioning.begin(15000);
}

void loop() {
  provisioning.loop();

  // Do not send fabricated sample sensor values.
  // Session 23 replaces this status-only scaffold with the previously validated
  // pH / DS18B20 / PT550 acquisition path.
  static uint32_t lastMessage = 0;
  if (millis() - lastMessage >= 5000) {
    lastMessage = millis();

    if (!provisioning.isConnected()) {
      Serial.println("[TELEMETRY] Offline/provisioning; local sensing can continue.");
    } else if (provisioning.telemetryUrl().isEmpty() ||
               provisioning.deviceToken().isEmpty()) {
      Serial.println(
          "[TELEMETRY] Wi-Fi connected, but endpoint/token is not configured. "
          "Send PROVISION to add them.");
    } else {
      Serial.println(
          "[TELEMETRY] Transport configuration ready. "
          "Integrate actual validated sensor values in Session 23.");
    }
  }

  delay(5);
}
