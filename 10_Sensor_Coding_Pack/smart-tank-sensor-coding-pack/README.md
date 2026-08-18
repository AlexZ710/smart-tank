# smart-tank Sensor Coding Pack

Standalone bring-up remains sensor-first:
- I2C scanner;
- ADS1115;
- SEN0161-V2 pH;
- DS18B20;
- PT550;
- optional isolated XKC;
- integrated monitor.

Common firmware utilities also include:
- first-boot Wi-Fi provisioning test (`00_Common/WiFi_Provisioning/`).

The provisioning utility is not a sensor. It is included here so students can verify device networking independently before integrating cloud telemetry.

Never insert real SSID/password values into the sensor sketches.
