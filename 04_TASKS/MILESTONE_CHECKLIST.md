# Milestones

> State authority is root `TASKS.md`. Reconciled at S28 (2026-09-16): M6/M7
> updated from live evidence; board-gated items elsewhere stay open until the
> ESP32-S3 is attached (S04-S08 runtime captures, EXP06 Part A).

## M1 S03 - scope/repository/schema
- [ ] hardware and unavailable sensors frozen
- [ ] repository/data schema established

## M2 S08 - firmware foundation + sensor bring-up
- [ ] Session 05 first-boot SoftAP/NVS provisioning works
- [ ] re-provision/factory-reset path works
- [ ] DS18B20 works
- [ ] pH works through ADS1115
- [ ] PT550 analog reading works
- [ ] optional XKC handled honestly

## M3 S12 - local data intelligence
- [ ] collector/cleaning/visualization
- [ ] deterministic events
- [ ] bounded AI reporting

## M4 S18 - core research milestone
- [ ] experiments/evidence/figures ready
- [ ] old 18-session core stays reproducible

## M5 S23 - connected provisioned device
- [ ] database/API online locally
- [ ] ESP32 sends actual telemetry over provisioned Wi-Fi
- [ ] no Wi-Fi credentials/device token are compiled into tracked source
- [ ] changed/unreachable Wi-Fi can return to provisioning mode

## M6 S26 - usable web facade
- [x] live/current status (S24; live-DB chain proven S28)
- [x] history/experiment markers (S25; live-DB chain proven S28)
- [x] events and AI report UI (S26; LIVE bounded report round-trip S28)

## M7 S28 - final delivery
- [ ] provisioning lifecycle evidence complete (DEFERRED: no board attached;
      source-level policy validation PASSED - docs/EXP06_Results.md Part A)
- [x] Vercel deployment or documented deployment-ready state (documented
      deployment-ready: docs/Vercel_Deployment_Guide.md + evidence/S27)
- [x] EXP06 reliability evidence (host-side software chain executed live incl.
      outage/recovery; hardware portions DEFERRED - docs/EXP06_Results.md)
- [x] final report/GitHub/demo complete (docs/Final_Report.md, README.md,
      docs/Demo_Script.md)
