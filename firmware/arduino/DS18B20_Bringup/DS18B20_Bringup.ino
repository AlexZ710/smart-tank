/*
 * DS18B20 Bring-up - smart-tank Session 06
 *
 * Standalone temperature sensor validation BEFORE integrated testing.
 * Wiring (see 02_Hardware_Bringup/DS18B20_Bringup_Guide.md):
 *   VCC  -> 3.3V
 *   GND  -> GND
 *   DATA -> GPIO4, with 4.7 kOhm pull-up between DATA and 3.3V
 *
 * Pass criteria (recorded in docs/ds18b20_validation.md):
 *   - exactly one probe detected with a valid 64-bit ROM address;
 *   - readings are plausible for the environment (~15-30 degC indoors);
 *   - readings are stable (no jump to the -127 degC disconnect sentinel);
 *   - 12-bit resolution confirmed.
 *
 * No Wi-Fi, no credentials, no other sensors in this sketch.
 */

#include <OneWire.h>
#include <DallasTemperature.h>

constexpr int ONE_WIRE_PIN = 4;      // locked by Hardware_Baseline_Lock.md
constexpr uint32_t REPORT_INTERVAL_MS = 2000;

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

DeviceAddress probeAddress;
bool probeFound = false;

void printAddress(const DeviceAddress& address) {
  for (uint8_t i = 0; i < 8; ++i) {
    if (address[i] < 0x10) Serial.print('0');
    Serial.print(address[i], HEX);
    if (i < 7) Serial.print(':');
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=== smart-tank S06 DS18B20 standalone bring-up ===");
  Serial.printf("1-Wire pin: GPIO%d (4.7k pull-up required)\n", ONE_WIRE_PIN);

  sensors.begin();

  const int count = sensors.getDeviceCount();
  Serial.printf("Devices found on bus: %d\n", count);

  if (count == 1 && sensors.getAddress(probeAddress, 0)) {
    probeFound = true;
    Serial.print("Probe ROM address: ");
    printAddress(probeAddress);
    Serial.println();
    Serial.printf("Resolution: %d bit\n", sensors.getResolution(probeAddress));
    sensors.setResolution(probeAddress, 12);
    Serial.printf("Resolution set to: %d bit\n", sensors.getResolution(probeAddress));
  } else if (count == 0) {
    Serial.println("ERROR: no DS18B20 detected. Check wiring and 4.7k pull-up.");
  } else {
    Serial.println("WARNING: expected exactly 1 probe; recheck bus wiring.");
  }

  Serial.println("timestamp_ms,temperature_c,status");
}

void loop() {
  static uint32_t lastReport = 0;
  if (millis() - lastReport < REPORT_INTERVAL_MS) {
    delay(10);
    return;
  }
  lastReport = millis();

  sensors.requestTemperatures();
  const float temperatureC = sensors.getTempCByIndex(0);

  const char* status = "OK";
  if (!probeFound) {
    status = "NO_PROBE";
  } else if (temperatureC <= DEVICE_DISCONNECTED_C + 1.0f) {
    // DallasTemperature uses -127 degC as the disconnect sentinel.
    status = "DISCONNECT_SENTINEL";
  } else if (temperatureC < -10.0f || temperatureC > 60.0f) {
    status = "IMPLAUSIBLE";
  }

  Serial.printf("%lu,%.3f,%s\n", (unsigned long)millis(), temperatureC, status);
}
