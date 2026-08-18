# First-Boot Wi-Fi Provisioning Guide

## Student workflow

### A. Upload once
Upload `SmartTank_WiFi_Provisioning.ino`.

### B. First boot
Open Serial Monitor at 115200 baud. Record:
- setup SSID;
- generated setup password;
- portal address.

### C. Join local setup network
On a phone/laptop:
1. disconnect from any VPN if it prevents local captive-portal access;
2. join `SmartTank-Setup-XXXXXX`;
3. enter the generated setup password;
4. open `http://192.168.4.1` if the captive page does not pop up automatically.

### D. Save Wi-Fi
Submit the target Wi-Fi SSID/password.

The password is sent only to the local ESP32 portal and persisted to NVS. It must not be copied into the repository.

### E. Confirm normal boot
After restart:
- SoftAP should disappear;
- ESP32 should connect to the target network;
- Serial should show the assigned IP;
- Serial must not print the Wi-Fi password.

## Later when API is ready
Send `PROVISION` over Serial, reopen the portal, and add:
- telemetry URL;
- device ingest token.

These values also persist locally in NVS.

## Recovery matrix

| Situation | Action |
|---|---|
| First ever boot | SoftAP starts automatically |
| Saved Wi-Fi works | Station mode |
| Saved Wi-Fi fails at boot | SoftAP fallback |
| Need to change Wi-Fi/API/token | Serial `PROVISION` |
| Need clean device state | Serial `CLEAR_WIFI` |
| Password changed on router | reboot -> failed STA -> SoftAP fallback |

## Do not
- hardcode the classroom/home SSID;
- create a committed `wifi_secrets.h`;
- print passwords/tokens for debugging;
- expose saved secrets through the final dashboard;
- treat the provisioning captive portal as the public dashboard.
