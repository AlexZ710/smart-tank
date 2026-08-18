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
]
for path in required_files:
    if not path.exists():
        violations.append(f"missing: {path.relative_to(ROOT)}")

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
