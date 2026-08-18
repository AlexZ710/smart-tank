#include <Wire.h>
#include <Adafruit_ADS1X15.h>
Adafruit_ADS1115 ads;
float v7=1.50f, v4=2.03f; // replace after real calibration
float toPH(float v){ float d=v7-v4; if(fabs(d)<0.0001f) return NAN; return 7.0f + ((7.0f-4.0f)/d)*(v-v7); }
void setup(){ Serial.begin(115200); delay(1000); Wire.begin(8,9); if(!ads.begin(0x48,&Wire)){while(true){Serial.println("ADS1115 missing");delay(1000);}} ads.setGain(GAIN_ONE); }
void loop(){ int16_t raw=ads.readADC_SingleEnded(1); float v=ads.computeVolts(raw); Serial.printf("raw=%d voltage=%.4fV pH=%.2f\n",raw,v,toPH(v)); delay(1000); }
