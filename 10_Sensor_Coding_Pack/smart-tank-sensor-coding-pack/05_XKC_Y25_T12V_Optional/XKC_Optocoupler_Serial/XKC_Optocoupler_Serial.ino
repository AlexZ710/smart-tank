constexpr int XKC_PIN=7;
void setup(){ Serial.begin(115200); pinMode(XKC_PIN,INPUT_PULLUP); }
void loop(){ Serial.printf("xkc_isolated_logic=%d\n",digitalRead(XKC_PIN)); delay(500); }
