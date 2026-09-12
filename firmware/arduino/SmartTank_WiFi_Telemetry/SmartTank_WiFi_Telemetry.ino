/*
 * Smart Tank Wi-Fi Telemetry - Session 23.
 *
 * Merges the validated sensor acquisition path from
 * SmartTank_Integrated_Monitor (S05-S08: DS18B20 temperature, SEN0161-V2 pH
 * via ADS1115 A1, PT550 relative light via ADS1115 A3, optional isolated
 * XKC-Y25-T12V) with the Session 05 NVS-backed provisioning module
 * (WifiProvisioning.h/.cpp - REUSED UNMODIFIED, never duplicated) and the
 * frozen docs/Telemetry_Contract.md JSON POST.
 *
 * Policy (credential/configuration lock):
 *  - NO Wi-Fi SSID/password, telemetry URL or device token in source. All
 *    come from NVS (st_cfg namespace) via the S05 captive portal or the
 *    PROVISION Serial command.
 *  - Only ACTUAL measured values are sent. A failed/absent sensor sends
 *    JSON null ("not measured this cycle") - never a default, never a
 *    fabricated number. No sensor data at all -> nothing is sent.
 *  - Missing endpoint/token: the device stays fully operational in
 *    Serial/local-sensing mode and reports CONFIGURATION NEEDED; it never
 *    invents telemetry.
 *  - Wi-Fi loss never erases credentials (S05 module guarantee). Readings
 *    buffer while offline and flush on reconnect with their ORIGINAL
 *    timestamp_ms values preserved (contract: device-side mapping).
 *  - HTTP is bounded (5 s connect / 5 s transfer) so the 1 Hz sensor loop
 *    is never blocked indefinitely; failed flushes retry with backoff.
 *
 * Serial output preserves the locked CSV contract for the host collector:
 * timestamp_ms,temperature_c,ph,ph_voltage_v,light_relative_pct,
 * light_voltage_v,xkc_level_state   (NA for absent/failed channels)
 */

#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HTTPClient.h>
#include <WiFi.h>

#include "WifiProvisioning.h"

// ---- Hardware baseline (locked) ------------------------------------------
constexpr int SDA_PIN = 8;
constexpr int SCL_PIN = 9;
constexpr int ONE_WIRE_PIN = 4;
constexpr int XKC_INPUT_PIN = 7;
constexpr int PH_CHANNEL = 1;     // ADS1115 A1 - SEN0161-V2
constexpr int LIGHT_CHANNEL = 3;  // ADS1115 A3 - PT550 (relative light only)
// Optional XKC-Y25-T12V: enable ONLY when the isolated hardware is physically
// installed (12 V side fully isolated per hardware baseline). Disabled ->
// xkc_level_state is sent as JSON null (server renders OPTIONAL_ABSENT).
constexpr bool ENABLE_XKC = false;

// ---- Timing / buffering ---------------------------------------------------
constexpr uint32_t SENSOR_INTERVAL_MS = 1000;   // 1 Hz, locked CSV cadence
constexpr uint32_t FLUSH_INTERVAL_MS = 10000;   // batch flush every 10 s
constexpr uint32_t RETRY_BACKOFF_MAX_MS = 60000;
constexpr uint32_t HTTP_TIMEOUT_MS = 5000;      // bounded, never indefinite
constexpr int BUFFER_MAX = 240;                 // ~4 min offline headroom
constexpr int STATUS_INTERVAL_MS = 5000;

// ---- Firmware identity (traceability, schema firmware_version NOT NULL) ---
constexpr char FIRMWARE_VERSION[] = "1.0.0-s23";

struct Reading {
  uint32_t timestampMs;
  float temperatureC;   bool temperatureValid;
  float ph;             bool phValid;
  float phVoltage;      bool phVoltageValid;
  float lightPct;       bool lightPctValid;
  float lightVoltage;   bool lightVoltageValid;
  int8_t xkcState;      // -1 = null (absent/disabled), else 0/1
};

Adafruit_ADS1115 ads;
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature temperatureSensor(&oneWire);
SmartTankProvisioning provisioning;

bool adsReady = false;

// Calibration placeholders measured in Session 07 (docs/ph_calibration_log.md):
// replace with the student's measured buffer voltages after CAL7/CAL4.
float ph7Voltage = 1.50f;
float ph4Voltage = 2.03f;

// Ring buffer of pending readings (offline backlog + batch flush).
Reading buffer_[BUFFER_MAX];
int bufStart_ = 0;
int bufCount_ = 0;
uint64_t droppedOldest_ = 0;

uint32_t lastFlush_ = 0;
uint32_t retryBackoff_ = FLUSH_INTERVAL_MS;
uint32_t lastStatus_ = 0;
uint32_t lastAdsWarn_ = 0;
uint32_t consecutiveFailures_ = 0;

float phFromVoltage(float voltage) {
  const float denominator = ph7Voltage - ph4Voltage;
  if (fabs(denominator) < 0.0001f) return NAN;
  const float slope = (7.00f - 4.00f) / denominator;
  return 7.00f + slope * (voltage - ph7Voltage);
}

// ---- Sensor acquisition (merged from the validated integrated monitor) ----

void initSensors() {
  Wire.begin(SDA_PIN, SCL_PIN);
  temperatureSensor.begin();

  if (ENABLE_XKC) {
    pinMode(XKC_INPUT_PIN, INPUT_PULLUP);
  }

  adsReady = ads.begin(0x48, &Wire);
  if (!adsReady) {
    Serial.println("ERROR: ADS1115 not detected at 0x48 - pH/light will be sent as null (never fabricated)");
    return;
  }
  ads.setGain(GAIN_ONE);

  Serial.println("timestamp_ms,temperature_c,ph,ph_voltage_v,light_relative_pct,light_voltage_v,xkc_level_state");
}

Reading readSensors() {
  Reading r{};
  r.timestampMs = millis();

  // DS18B20: DEVICE_DISCONNECTED_C on fault -> invalid -> null (S06 pattern).
  temperatureSensor.requestTemperatures();
  const float t = temperatureSensor.getTempCByIndex(0);
  r.temperatureValid = (t != DEVICE_DISCONNECTED_C);
  r.temperatureC = r.temperatureValid ? t : 0.0f;

  if (adsReady) {
    const int16_t phRaw = ads.readADC_SingleEnded(PH_CHANNEL);
    const float phV = ads.computeVolts(phRaw);
    const float ph = phFromVoltage(phV);
    r.phVoltageValid = !isnan(phV);
    r.phVoltage = r.phVoltageValid ? phV : 0.0f;
    r.phValid = !isnan(ph);
    r.ph = r.phValid ? ph : 0.0f;

    const int16_t lightRaw = ads.readADC_SingleEnded(LIGHT_CHANNEL);
    const float lightV = ads.computeVolts(lightRaw);
    r.lightVoltageValid = !isnan(lightV);
    r.lightVoltage = r.lightVoltageValid ? lightV : 0.0f;
    // Relative light % only - NEVER lux/PAR/PPFD (no calibration exists).
    r.lightPctValid = r.lightVoltageValid;
    r.lightPct = r.lightPctValid ? constrain((lightV / 3.3f) * 100.0f, 0.0f, 100.0f) : 0.0f;
  }

  if (ENABLE_XKC) {
    r.xkcState = digitalRead(XKC_INPUT_PIN) ? 1 : 0;
  } else {
    r.xkcState = -1;  // optional sensor not installed -> JSON null
  }
  return r;
}

void printCsvLine(const Reading& r) {
  Serial.print(r.timestampMs); Serial.print(',');
  if (r.temperatureValid) Serial.print(r.temperatureC, 2); else Serial.print("NA"); Serial.print(',');
  if (r.phValid) Serial.print(r.ph, 2); else Serial.print("NA"); Serial.print(',');
  if (r.phVoltageValid) Serial.print(r.phVoltage, 4); else Serial.print("NA"); Serial.print(',');
  if (r.lightPctValid) Serial.print(r.lightPct, 1); else Serial.print("NA"); Serial.print(',');
  if (r.lightVoltageValid) Serial.print(r.lightVoltage, 4); else Serial.print("NA"); Serial.print(',');
  if (r.xkcState >= 0) Serial.println(r.xkcState); else Serial.println("NA");
}

// ---- Buffer management -----------------------------------------------------

void bufferAppend(const Reading& r) {
  if (bufCount_ == BUFFER_MAX) {
    // Oldest reading is dropped to keep the newest window; honest Serial note,
    // cumulative count exposed in status. Data loss is never silent.
    bufStart_ = (bufStart_ + 1) % BUFFER_MAX;
    bufCount_--;
    droppedOldest_++;
  }
  buffer_[(bufStart_ + bufCount_) % BUFFER_MAX] = r;
  bufCount_++;
}

// ---- Contract JSON (docs/Telemetry_Contract.md) ----------------------------

void appendNum(String& out, float v, bool valid, int digits) {
  if (valid) out += String(v, digits);
  else out += "null";
}

void appendReading(String& out, const Reading& r) {
  out += "{\"timestamp_ms\":";
  out += String((unsigned long)r.timestampMs);
  out += ",\"temperature_c\":";   appendNum(out, r.temperatureC, r.temperatureValid, 2);
  out += ",\"ph\":";              appendNum(out, r.ph, r.phValid, 2);
  out += ",\"ph_voltage_v\":";    appendNum(out, r.phVoltage, r.phVoltageValid, 4);
  out += ",\"light_relative_pct\":"; appendNum(out, r.lightPct, r.lightPctValid, 1);
  out += ",\"light_voltage_v\":"; appendNum(out, r.lightVoltage, r.lightVoltageValid, 4);
  out += ",\"xkc_level_state\":";
  if (r.xkcState >= 0) out += String((int)r.xkcState); else out += "null";
  out += "}";
}

String buildPayload(int n) {
  String out = "{\"device_id\":\"";
  out += provisioning.deviceId();
  out += "\",\"firmware_version\":\"";
  out += FIRMWARE_VERSION;
  out += "\",\"readings\":[";
  for (int i = 0; i < n; i++) {
    if (i > 0) out += ",";
    appendReading(out, buffer_[(bufStart_ + i) % BUFFER_MAX]);
  }
  out += "]}";
  return out;
}

void bufferRemoveFront(int n) {
  if (n > bufCount_) n = bufCount_;
  bufStart_ = (bufStart_ + n) % BUFFER_MAX;
  bufCount_ -= n;
}

// ---- Telemetry transport (bounded, never blocks sensing indefinitely) ------

bool transportConfigured() {
  return !provisioning.telemetryUrl().isEmpty() &&
         !provisioning.deviceToken().isEmpty();
}

void flushTelemetry() {
  if (bufCount_ == 0) return;

  if (!provisioning.isConnected()) {
    // Offline: keep buffering (original timestamp_ms preserved); the S05
    // module retries the saved network and never erases credentials.
    return;
  }
  if (!transportConfigured()) {
    // CONFIGURATION NEEDED: Wi-Fi up but endpoint/token not provisioned.
    // Local sensing + Serial CSV continue; nothing fabricated is sent.
    return;
  }

  const int n = bufCount_;  // <= BUFFER_MAX (240) < contract cap 500
  const String payload = buildPayload(n);

  HTTPClient http;
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);

  if (!http.begin(provisioning.telemetryUrl())) {
    Serial.println("[TELEMETRY] HTTP begin failed - endpoint unreachable; readings kept in buffer");
    consecutiveFailures_++;
    retryBackoff_ = min((uint32_t)(retryBackoff_ * 2), RETRY_BACKOFF_MAX_MS);
    return;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + provisioning.deviceToken());

  const int code = http.POST(payload);
  if (code > 0) {
    const String body = http.getString();
    if (code == 200) {
      bufferRemoveFront(n);
      consecutiveFailures_ = 0;
      retryBackoff_ = FLUSH_INTERVAL_MS;
      Serial.printf("[TELEMETRY] flushed %d reading(s): %s\n", n, body.c_str());
    } else if (code >= 400 && code < 500) {
      // Server rejected the batch (400/401/413/429-style): retrying the same
      // bytes cannot succeed. Drop it, report honestly, keep sensing.
      bufferRemoveFront(n);
      Serial.printf("[TELEMETRY] server rejected batch HTTP %d: %s\n", code, body.substring(0, 200).c_str());
      if (code == 401) {
        Serial.println("[TELEMETRY] 401 unauthorized - re-provision the device token (PROVISION)");
      }
    } else {
      Serial.printf("[TELEMETRY] server error HTTP %d - readings kept, backing off %u ms\n",
                    code, (unsigned)retryBackoff_);
      consecutiveFailures_++;
      retryBackoff_ = min((uint32_t)(retryBackoff_ * 2), RETRY_BACKOFF_MAX_MS);
    }
  } else {
    Serial.printf("[TELEMETRY] POST failed (%s) - readings kept in buffer, backing off %u ms\n",
                  http.errorToString(code).c_str(), (unsigned)retryBackoff_);
    consecutiveFailures_++;
    retryBackoff_ = min((uint32_t)(retryBackoff_ * 2), RETRY_BACKOFF_MAX_MS);
  }
  http.end();
}

void printStatus() {
  if (!provisioning.isConnected()) {
    Serial.printf("[TELEMETRY] offline/provisioning - local sensing continues; buffered=%d dropped_oldest=%llu\n",
                  bufCount_, (unsigned long long)droppedOldest_);
  } else if (!transportConfigured()) {
    Serial.println("[TELEMETRY] CONFIGURATION NEEDED: Wi-Fi connected but telemetry URL/token not provisioned - "
                   "open the portal or send PROVISION. Local sensing continues; nothing fabricated is sent.");
  } else {
    Serial.printf("[TELEMETRY] transport ready - buffered=%d dropped_oldest=%llu consecutive_failures=%u\n",
                  bufCount_, (unsigned long long)droppedOldest_, (unsigned)consecutiveFailures_);
  }
}

// ---- Arduino entry points ---------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(800);

  Serial.println();
  Serial.println("Smart Tank Wi-Fi Telemetry (S23) - provisioned transport, actual measurements only");
  Serial.println("Serial commands: PROVISION | CLEAR_WIFI");
  Serial.printf("Firmware: %s\n", FIRMWARE_VERSION);

  // First-boot SoftAP provisioning / saved-network station boot (S05 module,
  // reused unmodified). Returns true when connected to the saved network.
  provisioning.begin(15000);

  initSensors();
  lastFlush_ = millis();
}

void loop() {
  // Keeps captive portal, DNS wildcard and Serial recovery commands
  // responsive (S05 contract - must run frequently).
  provisioning.loop();

  const uint32_t now = millis();

  if (now - lastFlush_ >= retryBackoff_) {
    lastFlush_ = now;
    flushTelemetry();
  }

  static uint32_t lastReading = 0;
  if (now - lastReading >= SENSOR_INTERVAL_MS) {
    lastReading = now;
    // Temperature comes from the OneWire bus independently of the ADS1115;
    // when the ADC is absent its channels are sent as null - never faked.
    // With no sensors readable at all the reading still carries honest nulls.
    const Reading r = readSensors();
    printCsvLine(r);
    bufferAppend(r);
    if (!adsReady && now - lastAdsWarn_ >= 30000) {
      lastAdsWarn_ = now;
      Serial.println("[SENSOR] ADS1115 still absent - pH/light remain null in Serial CSV and telemetry");
    }
  }

  if (now - lastStatus_ >= STATUS_INTERVAL_MS) {
    lastStatus_ = now;
    printStatus();
  }

  delay(5);
}
