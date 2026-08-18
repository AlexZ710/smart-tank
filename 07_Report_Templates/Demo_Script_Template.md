# Demo Script Template - 2 to 3 minutes

1. Show the physical 5 L system and identify pH, DS18B20, PT550, ESP32-S3 and ADS1115.
2. Briefly show the provisioning concept: on a clean/recovery state the ESP32 exposes `SmartTank-Setup-XXXXXX` and a local setup portal. Do not reveal real credentials on camera.
3. Show Serial Monitor briefly as engineering/recovery evidence, not as the final interface.
4. Show normal operation with ESP32 connected through provisioned Wi-Fi.
5. Disconnect the laptop USB data path if practical and show ESP32 continuing over Wi-Fi.
6. Open the web dashboard on laptop/phone.
7. Show latest pH, temperature, light and optional level state.
8. Open a historical chart and an experiment marker.
9. Open the event/alert history.
10. Show one bounded AI report that only discusses observed/manual data.
11. State unavailable sensors explicitly: no ORP, EC, ZP4510, or FS300A.
12. Conclude with:
   `local provisioning -> ESP32 sensing -> Wi-Fi -> web/database -> human decision`.
