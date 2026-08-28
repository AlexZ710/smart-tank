from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
FW = ROOT / "firmware" / "arduino"

patterns = {
    "hardcoded WIFI_SSID": re.compile(r"\bWIFI_SSID\b"),
    "hardcoded WIFI_PASSWORD": re.compile(r"\bWIFI_PASSWORD\b"),
    'placeholder "SET_LOCALLY"': re.compile(r"SET_LOCALLY"),
}

violations = []
for path in FW.rglob("*"):
    if path.suffix.lower() not in {".ino", ".h", ".hpp", ".c", ".cpp"}:
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    for label, rx in patterns.items():
        if rx.search(text):
            violations.append(f"{path.relative_to(ROOT)}: {label}")

required_files = [
    FW / "SmartTank_WiFi_Provisioning" / "WifiProvisioning.cpp",
    FW / "SmartTank_WiFi_Provisioning" / "WifiProvisioning.h",
    # Session 05: the reusable provisioning module must also be embedded in
    # the telemetry scaffold (S23 reuse) and the integrated monitor (S05).
    FW / "SmartTank_WiFi_Telemetry" / "WifiProvisioning.cpp",
    FW / "SmartTank_WiFi_Telemetry" / "WifiProvisioning.h",
    FW / "SmartTank_Integrated_Monitor" / "WifiProvisioning.cpp",
    FW / "SmartTank_Integrated_Monitor" / "WifiProvisioning.h",
]
for path in required_files:
    if not path.exists():
        violations.append(f"missing: {path.relative_to(ROOT)}")

# Session 05: the integrated monitor must use the shared provisioning entry
# points instead of introducing its own credential mechanism.
monitor_ino = (FW / "SmartTank_Integrated_Monitor" / "SmartTank_Integrated_Monitor.ino")
if monitor_ino.exists():
    monitor_text = monitor_ino.read_text(encoding="utf-8", errors="ignore")
    for marker in ['#include "WifiProvisioning.h"', "provisioning.begin", "provisioning.loop"]:
        if marker not in monitor_text:
            violations.append(f"SmartTank_Integrated_Monitor missing provisioning marker: {marker}")
    # Hardcoded credential constants are already rejected by the pattern scan
    # above; this keeps an explicit, readable check for the S05 gate.
    if "WIFI_SSID" in monitor_text or "WIFI_PASSWORD" in monitor_text:
        violations.append("SmartTank_Integrated_Monitor contains hardcoded credential constants")
else:
    violations.append("missing: SmartTank_Integrated_Monitor sketch")

cpp = (FW / "SmartTank_WiFi_Provisioning" / "WifiProvisioning.cpp").read_text(
    encoding="utf-8", errors="ignore"
)
for required in [
    "WiFi.softAP",
    "Preferences",
    'dns_.start(53, "*", kPortalIp)',
    "prefs_.clear()",
    '"PROVISION"',
    '"CLEAR_WIFI"',
]:
    if required not in cpp and required not in (
        FW / "SmartTank_WiFi_Provisioning" / "WifiProvisioning.h"
    ).read_text(encoding="utf-8", errors="ignore"):
        violations.append(f"provisioning implementation missing marker: {required}")

if violations:
    print("Provisioning policy validation FAILED")
    for item in violations:
        print(" -", item)
    sys.exit(1)

print("Provisioning policy validation PASSED")
