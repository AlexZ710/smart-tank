# Hardware Deviation Record

The original China-local procurement guide listed a broader set of sensors. The current project has been deliberately refactored to match hardware that is actually available.

| Historical item | Current disposition | Project effect |
|---|---|---|
| ORP | Not available | Entire ORP branch removed |
| EC / conductivity | Not available | Automated EC/salinity branch removed; salinity is manual |
| ZP4510 float switches | Not available | Dual-float safety logic and fields removed |
| FS300A flow sensor | Not available | Flow demo, pulse code and flow fields removed |
| BH1750 | Replaced | PT550 analog light on ADS1115 A3 |
| XKC-Y25-T12V | Optional | Supported only when physically present and isolated |

This is not a temporary software disable. The missing hardware must not appear as if it were implemented in reports or demonstrations.
