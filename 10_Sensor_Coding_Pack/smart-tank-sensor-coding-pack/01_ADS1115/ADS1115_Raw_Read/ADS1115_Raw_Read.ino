#include <Wire.h>
#include <Adafruit_ADS1X15.h>
Adafruit_ADS1115 ads;
void setup(){
  Serial.begin(115200); delay(1000); Wire.begin(8,9);
  if(!ads.begin(0x48,&Wire)){ Serial.println("ERROR ADS1115"); while(true) delay(1000); }
  ads.setGain(GAIN_ONE); Serial.println("ADS1115 OK");
}
void loop(){
  for(int ch=0;ch<4;ch++){ int16_t raw=ads.readADC_SingleEnded(ch); Serial.printf("A%d raw=%d V=%.4f ",ch,raw,ads.computeVolts(raw)); }
  Serial.println(); delay(1000);
}
