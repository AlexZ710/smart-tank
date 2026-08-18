# Optional XKC-Y25-T12V Bring-up Guide

This sensor is optional. Skip this guide entirely if the hardware is not physically available.

## Electrical boundary
The XKC-Y25-T12V uses a 12 V domain. Its signal must pass through an optocoupler or validated level-conversion interface before reaching ESP32 GPIO.

```text
12 V supply -> XKC sensor -> optocoupler input
                           || galvanic / level boundary ||
3.3 V -> optocoupler output pull-up -> ESP32 GPIO7
GND on the ESP32 side follows the chosen isolation module topology.
```

Never connect the XKC 12 V output directly to GPIO7.
