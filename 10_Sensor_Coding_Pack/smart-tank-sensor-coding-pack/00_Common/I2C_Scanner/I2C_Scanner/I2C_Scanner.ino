#include <Wire.h>
void setup(){
  Serial.begin(115200); delay(1000); Wire.begin(8,9);
  Serial.println("Scanning I2C...");
  for(uint8_t a=1;a<127;a++){
    Wire.beginTransmission(a);
    if(Wire.endTransmission()==0){ Serial.print("0x"); if(a<16) Serial.print('0'); Serial.println(a,HEX); }
  }
}
void loop(){}
