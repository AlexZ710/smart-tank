# XKC-Y25-T12V Optional Detailed Wiring

Skip this module if it is not physically available.

## Required isolation
`12 V XKC output → optocoupler / validated interface → 3.3 V logic → ESP32 GPIO7`

Never connect the 12 V sensor output directly to ESP32. The exact optocoupler resistor network depends on the chosen isolation module; follow its rated input specification rather than guessing component values.
