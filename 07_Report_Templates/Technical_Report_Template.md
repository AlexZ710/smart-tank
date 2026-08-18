# Technical Report Template - Smart Tank

## 1. Introduction
Problem, 5 L laboratory rationale, and agent-friendly monitoring concept.

## 2. System Design
### 2.1 Physical hardware
ESP32-S3-WROOM-1, ADS1115, pH, DS18B20, PT550, optional XKC.

### 2.2 Removed/unavailable sensors
Explicitly document that ORP, EC, ZP4510, and FS300A were not implemented. Do not write results for unavailable sensors.

### 2.3 First-boot provisioning architecture
Document:
- local SoftAP/captive portal;
- NVS/Preferences persistence;
- bounded station connection;
- failed-network fallback;
- re-provisioning/factory-reset path;
- secret-handling boundary.

### 2.4 Network and web architecture
ESP32 -> provisioned Wi-Fi -> authenticated JSON ingestion -> Next.js -> PostgreSQL -> dashboard.

## 3. Methods
Calibration, sampling, data validation, manual salinity measurement, experiment procedures, event rules, AI boundary, provisioning test method, and network outage test method.

## 4. Web Facade
Explain pages, database schema, ingestion contract, device status, charts, event UI, and deployment. Clearly distinguish the local provisioning portal from the final web facade.

## 5. Experiments
- EXP01 baseline stability
- EXP02 temperature response
- EXP03 pH perturbation
- EXP04 manual salinity drift
- EXP05 organic-load risk observation
- EXP06 provisioning + Wi-Fi/web telemetry reliability

## 6. Results
Figures must identify units, time ranges, experiment markers, and missing/unavailable measurements honestly.

## 7. Discussion
Sensor limitations, provisioning/NVS trust boundary, network/database failure modes, false alerts, manual vs automatic measurements, and scalability.

## 8. Conclusion

## 9. Reproducibility
Hardware wiring, Arduino version/board selection, first-boot/re-provisioning procedure, environment variables, Docker database setup, web startup, deployment, and validation commands.

## 10. Security/Reproducibility audit
State that no real Wi-Fi password/device token/database password is included in the public repository.
