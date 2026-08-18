# Hardware Deviation Record - smart-tank

> Frozen in Session 02 (working copy; authoritative package-level record is
> `../01_Project_Documentation/Hardware_Deviation_Record.md`).

The original China-local procurement guide listed a broader sensor set. The
project was deliberately refactored to match hardware that is actually
available. This record freezes those deviations.

| Historical item | Current disposition | Project effect |
|---|---|---|
| ORP | Not available | Entire ORP branch removed; no ORP fields anywhere |
| EC / conductivity | Not available | Automated EC/salinity branch removed; salinity is manual refractometer/hydrometer input only |
| ZP4510 float switches | Not available | Dual-float safety logic and fields removed |
| FS300A flow sensor | Not available | Flow demo, pulse code and flow fields removed |
| BH1750 digital lux sensor | Replaced | PT550 analog light sensor on ADS1115 A3; relative trend only, never PAR/PPFD/lux claims |
| XKC-Y25-T12V | Optional | Supported only when physically present and wired through proper isolation/level conversion; nullable otherwise |

## Rules carried by these deviations

1. These are **not temporary software disables**. Removed hardware must not
   reappear as if implemented - in code, schemas, charts, demos, or reports.
2. No fabricated telemetry: absent sensors produce absent fields, never
   placeholder or invented values.
3. Salinity and ammonia remain manual/absent per
   `docs/measurement_boundary.md`.
4. Reintroducing ORP, EC, ZP4510, or FS300A requires changing
   `Hardware_Baseline_Lock.md` first - which currently forbids them - then
   this record, in the same session commit.

## Session 02 review statement

Reviewed against the current repository state: no ORP/EC/ZP4510/FS300A
implementation exists in firmware, backend, web, or docs beyond explicit
"absent/forbidden" declarations. No new deviations discovered this session.
