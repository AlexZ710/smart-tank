/*
 * PT550 Ambient-Light Bring-up - smart-tank Session 08
 *
 * Standalone validation BEFORE integrated testing:
 *   PT550 analog output -> ADS1115 A3 (ADS1115 at 0x48, SDA GPIO8/SCL GPIO9).
 *
 * Reporting per 02_Hardware_Bringup/PT550_Analog_Light_Bringup_Guide.md:
 *   - raw ADS1115 counts;
 *   - voltage;
 *   - relative percentage against the selected voltage reference.
 *
 * IMPORTANT: this is a relative light signal. It is NOT calibrated lux,
 * PAR, or PPFD, and must never be reported as such.
 *
 * No Wi-Fi, no credentials, no other sensors in this sketch.
 */

#include <Wire.h>
#include <Adafruit_ADS1X15.h>

constexpr int SDA_PIN = 8;          // locked wiring (ADS1115 guide)
constexpr int SCL_PIN = 9;
constexpr uint8_t ADS_ADDR = 0x48;
constexpr int LIGHT_CHANNEL = 3;    // PT550 on A3 (baseline lock)
constexpr float REFERENCE_V = 3.3f; // relative scale reference

constexpr uint32_t REPORT_INTERVAL_MS = 1000;

Adafruit_ADS1115 ads;
bool adsReady = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=== smart-tank S08 PT550 standalone bring-up ===");
  Serial.printf("I2C: SDA=GPIO%d SCL=GPIO%d, ADS1115 at 0x%02X, light input A3\n",
                SDA_PIN, SCL_PIN, ADS_ADDR);
  Serial.println("Value is a RELATIVE light signal - not lux/PAR/PPFD.");

  Wire.begin(SDA_PIN, SCL_PIN);
  adsReady = ads.begin(ADS_ADDR, &Wire);

  if (!adsReady) {
    Serial.println("ERROR: ADS1115 not detected at 0x48.");
    return;
  }

  ads.setGain(GAIN_ONE);
  Serial.println("ADS1115 detected at 0x48, gain=1 (+/- 4.096 V).");
  Serial.println("timestamp_ms,light_raw_counts,light_voltage_v,light_relative_pct");
}

void loop() {
  if (!adsReady) {
    delay(1000);
    return;
  }

  static uint32_t lastReport = 0;
  if (millis() - lastReport < REPORT_INTERVAL_MS) {
    delay(5);
    return;
  }
  lastReport = millis();

  const int16_t raw = ads.readADC_SingleEnded(LIGHT_CHANNEL);
  const float voltage = ads.computeVolts(raw);
  const float relativePct = constrain((voltage / REFERENCE_V) * 100.0f, 0.0f, 100.0f);

  Serial.printf("%lu,%d,%.4f,%.1f\n",
                (unsigned long)millis(), raw, voltage, relativePct);
}
