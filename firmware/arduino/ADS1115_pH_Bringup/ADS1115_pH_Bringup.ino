/*
 * ADS1115 + SEN0161-V2 pH Bring-up - smart-tank Session 07
 *
 * Standalone validation BEFORE integrated testing:
 *   1. verify ADS1115 detected at 0x48 (SDA GPIO8, SCL GPIO9, ADDR->GND);
 *   2. read the SEN0161-V2 analog output on ADS1115 A1;
 *   3. run the two-point pH calibration workflow (pH 7.00 / pH 4.00 buffers).
 *
 * Wiring per 02_Hardware_Bringup guides:
 *   ADS1115 VDD -> 3.3V, ADDR -> GND; SEN0161-V2 module per its guide
 *   (module powered as specified, analog out -> A1, common GND).
 *
 * Serial commands at 115200:
 *   CAL7   - capture the current stable A1 voltage as the pH 7.00 point
 *   CAL4   - capture the current stable A1 voltage as the pH 4.00 point
 *   SHOWCAL- print the active calibration constants
 *
 * Captured constants must be recorded in docs/ph_calibration_log.md and
 * entered into integrated sketches before pH values are trusted.
 *
 * No Wi-Fi, no credentials, no other sensors in this sketch.
 */

#include <Wire.h>
#include <Adafruit_ADS1X15.h>

constexpr int SDA_PIN = 8;          // locked wiring (ADS1115 guide)
constexpr int SCL_PIN = 9;
constexpr uint8_t ADS_ADDR = 0x48;  // ADDR pin -> GND
constexpr int PH_CHANNEL = 1;       // SEN0161-V2 on A1 (baseline lock)

constexpr uint32_t REPORT_INTERVAL_MS = 1000;
constexpr int CAL_SAMPLES = 32;

Adafruit_ADS1115 ads;
bool adsReady = false;

// Two-point calibration constants. Placeholders follow the starter defaults;
// they become trustworthy only after CAL7/CAL4 capture in real buffers.
float ph7Voltage = 1.50f;
float ph4Voltage = 2.03f;
bool calibrated = false;

float readA1Voltage() {
  const int16_t raw = ads.readADC_SingleEnded(PH_CHANNEL);
  return ads.computeVolts(raw);
}

float captureAverageVoltage() {
  double sum = 0.0;
  for (int i = 0; i < CAL_SAMPLES; ++i) {
    sum += readA1Voltage();
    delay(10);
  }
  return static_cast<float>(sum / CAL_SAMPLES);
}

float phFromVoltage(float voltage) {
  const float denominator = ph7Voltage - ph4Voltage;
  if (fabs(denominator) < 0.0001f) return NAN;
  const float slope = (7.00f - 4.00f) / denominator;
  return 7.00f + slope * (voltage - ph7Voltage);
}

void printCalibration() {
  Serial.printf("[CAL] ph7Voltage=%.4f V, ph4Voltage=%.4f V, calibrated=%s\n",
                ph7Voltage, ph4Voltage, calibrated ? "yes" : "no");
  Serial.println("[CAL] Record these values in docs/ph_calibration_log.md and");
  Serial.println("[CAL] enter them into integrated sketches before trusting pH.");
}

void pollSerialCommands() {
  static String line;
  while (Serial.available()) {
    const char c = static_cast<char>(Serial.read());
    if (c == '\r') continue;
    if (c == '\n') {
      line.trim();
      line.toUpperCase();

      if (line == "CAL7") {
        Serial.println("[CAL] Capturing pH 7.00 buffer point (probe must be in buffer)...");
        ph7Voltage = captureAverageVoltage();
        Serial.printf("[CAL] pH 7.00 point captured: %.4f V\n", ph7Voltage);
        calibrated = true;
        printCalibration();
      } else if (line == "CAL4") {
        Serial.println("[CAL] Capturing pH 4.00 buffer point (probe must be in buffer)...");
        ph4Voltage = captureAverageVoltage();
        Serial.printf("[CAL] pH 4.00 point captured: %.4f V\n", ph4Voltage);
        calibrated = true;
        printCalibration();
      } else if (line == "SHOWCAL") {
        printCalibration();
      }

      line = "";
      continue;
    }
    if (line.length() < 32) line += c;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=== smart-tank S07 ADS1115 + pH standalone bring-up ===");
  Serial.printf("I2C: SDA=GPIO%d SCL=GPIO%d, expecting ADS1115 at 0x%02X\n",
                SDA_PIN, SCL_PIN, ADS_ADDR);

  Wire.begin(SDA_PIN, SCL_PIN);
  adsReady = ads.begin(ADS_ADDR, &Wire);

  if (!adsReady) {
    Serial.println("ERROR: ADS1115 not detected at 0x48.");
    Serial.println("Check wiring (VDD 3.3V, ADDR->GND), then retry.");
    return;
  }

  ads.setGain(GAIN_ONE);
  Serial.println("ADS1115 detected at 0x48, gain=1 (+/- 4.096 V).");
  Serial.println("pH input: SEN0161-V2 analog out -> ADS1115 A1.");
  Serial.println("Commands: CAL7 | CAL4 | SHOWCAL");
  printCalibration();

  Serial.println("timestamp_ms,ph_raw_voltage_v,ph,status");
}

void loop() {
  if (!adsReady) {
    delay(1000);
    return;
  }

  pollSerialCommands();

  static uint32_t lastReport = 0;
  if (millis() - lastReport < REPORT_INTERVAL_MS) {
    delay(5);
    return;
  }
  lastReport = millis();

  const float voltage = readA1Voltage();

  const char* status = calibrated ? "OK" : "UNCALIBRATED";
  float ph = NAN;
  if (calibrated) {
    ph = phFromVoltage(voltage);
    if (isnan(ph) || ph < -1.0f || ph > 15.0f) {
      status = "IMPLAUSIBLE";
    }
  }

  if (isnan(ph)) {
    Serial.printf("%lu,%.4f,,%s\n", (unsigned long)millis(), voltage, status);
  } else {
    Serial.printf("%lu,%.4f,%.2f,%s\n", (unsigned long)millis(), voltage, ph, status);
  }
}
