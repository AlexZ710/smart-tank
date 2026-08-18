#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// smart-tank core baseline: pH + temperature + PT550 light.
// Optional XKC can be enabled only when the isolated hardware is physically installed.

constexpr int SDA_PIN = 8;
constexpr int SCL_PIN = 9;
constexpr int ONE_WIRE_PIN = 4;
constexpr int XKC_INPUT_PIN = 7;
constexpr int PH_CHANNEL = 1;
constexpr int LIGHT_CHANNEL = 3;
constexpr bool ENABLE_XKC = false;

Adafruit_ADS1115 ads;
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature temperatureSensor(&oneWire);

// Replace with the student's measured calibration voltages.
float ph7Voltage = 1.50f;
float ph4Voltage = 2.03f;

float phFromVoltage(float voltage) {
  const float denominator = ph7Voltage - ph4Voltage;
  if (fabs(denominator) < 0.0001f) return NAN;
  const float slope = (7.00f - 4.00f) / denominator;
  return 7.00f + slope * (voltage - ph7Voltage);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Wire.begin(SDA_PIN, SCL_PIN);
  temperatureSensor.begin();

  if (ENABLE_XKC) {
    pinMode(XKC_INPUT_PIN, INPUT_PULLUP);
  }

  if (!ads.begin(0x48, &Wire)) {
    Serial.println("ERROR: ADS1115 not detected at 0x48");
    while (true) delay(1000);
  }
  ads.setGain(GAIN_ONE);

  Serial.println("timestamp_ms,temperature_c,ph,ph_voltage_v,light_relative_pct,light_voltage_v,xkc_level_state");
}

void loop() {
  temperatureSensor.requestTemperatures();
  const float temperatureC = temperatureSensor.getTempCByIndex(0);

  const int16_t phRaw = ads.readADC_SingleEnded(PH_CHANNEL);
  const float phVoltage = ads.computeVolts(phRaw);
  const float ph = phFromVoltage(phVoltage);

  const int16_t lightRaw = ads.readADC_SingleEnded(LIGHT_CHANNEL);
  const float lightVoltage = ads.computeVolts(lightRaw);
  const float lightRelativePct = constrain((lightVoltage / 3.3f) * 100.0f, 0.0f, 100.0f);

  Serial.print(millis()); Serial.print(',');
  Serial.print(temperatureC, 2); Serial.print(',');
  Serial.print(ph, 2); Serial.print(',');
  Serial.print(phVoltage, 4); Serial.print(',');
  Serial.print(lightRelativePct, 1); Serial.print(',');
  Serial.print(lightVoltage, 4); Serial.print(',');

  if (ENABLE_XKC) {
    Serial.println(digitalRead(XKC_INPUT_PIN));
  } else {
    Serial.println("NA");
  }

  delay(1000);
}
