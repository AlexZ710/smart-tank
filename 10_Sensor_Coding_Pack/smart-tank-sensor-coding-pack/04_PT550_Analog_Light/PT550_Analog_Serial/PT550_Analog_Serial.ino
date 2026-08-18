#include <Wire.h>
#include <Adafruit_ADS1X15.h>
Adafruit_ADS1115 ads;
void setup(){ Serial.begin(115200); delay(1000); Wire.begin(8,9); if(!ads.begin(0x48,&Wire)){while(true){Serial.println("ADS1115 missing");delay(1000);}} ads.setGain(GAIN_ONE); }
void loop(){ int16_t raw=ads.readADC_SingleEnded(3); float v=ads.computeVolts(raw); float rel=constrain(v/3.3f*100.0f,0.0f,100.0f); Serial.printf("raw=%d voltage=%.4fV light_relative=%.1f%%\n",raw,v,rel); delay(1000); }
