#include <OneWire.h>
#include <DallasTemperature.h>
OneWire oneWire(4); DallasTemperature sensor(&oneWire);
void setup(){ Serial.begin(115200); delay(1000); sensor.begin(); }
void loop(){ sensor.requestTemperatures(); Serial.printf("temperature_c=%.2f\n",sensor.getTempCByIndex(0)); delay(1000); }
