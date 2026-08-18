#include "WifiProvisioning.h"

SmartTankProvisioning provisioning;

void setup() {
  Serial.begin(115200);
  delay(800);

  Serial.println();
  Serial.println("Smart Tank first-boot Wi-Fi provisioning test");
  Serial.println("Serial commands: PROVISION | CLEAR_WIFI");

  provisioning.begin(15000);
}

void loop() {
  provisioning.loop();

  static uint32_t lastStatus = 0;
  if (millis() - lastStatus >= 5000) {
    lastStatus = millis();

    if (provisioning.isConnected()) {
      Serial.printf("[STATUS] Wi-Fi connected. IP=%s\n",
                    WiFi.localIP().toString().c_str());
    } else if (provisioning.isPortalActive()) {
      Serial.println("[STATUS] Provisioning portal active.");
    } else {
      Serial.println("[STATUS] Wi-Fi not connected.");
    }
  }

  delay(5);
}
