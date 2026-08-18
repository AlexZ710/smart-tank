#include "WifiProvisioning.h"

#include <esp_system.h>

namespace {
constexpr char kPrefsNamespace[] = "st_cfg";
constexpr char kKeySsid[] = "ssid";
constexpr char kKeyPassword[] = "pass";
constexpr char kKeyApiUrl[] = "api_url";
constexpr char kKeyToken[] = "token";

const IPAddress kPortalIp(192, 168, 4, 1);
const IPAddress kPortalGateway(192, 168, 4, 1);
const IPAddress kPortalSubnet(255, 255, 255, 0);
}  // namespace

SmartTankProvisioning::SmartTankProvisioning() : server_(80) {}

String SmartTankProvisioning::makeDeviceId() const {
  const uint64_t chip = ESP.getEfuseMac();
  char buf[13];
  snprintf(buf, sizeof(buf), "%04X%08X",
           static_cast<uint16_t>(chip >> 32),
           static_cast<uint32_t>(chip));
  return String(buf);
}

String SmartTankProvisioning::makeOneTimePassword() const {
  static const char alphabet[] =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  String result;
  result.reserve(10);
  for (int i = 0; i < 10; ++i) {
    result += alphabet[esp_random() % (sizeof(alphabet) - 1)];
  }
  return result;
}

bool SmartTankProvisioning::loadConfig() {
  if (!prefs_.begin(kPrefsNamespace, true)) {
    Serial.println("[PROVISION] Could not open NVS configuration.");
    return false;
  }

  ssid_ = prefs_.getString(kKeySsid, "");
  password_ = prefs_.getString(kKeyPassword, "");
  telemetryUrl_ = prefs_.getString(kKeyApiUrl, "");
  deviceToken_ = prefs_.getString(kKeyToken, "");
  prefs_.end();

  ssid_.trim();
  telemetryUrl_.trim();
  deviceToken_.trim();
  return !ssid_.isEmpty();
}

void SmartTankProvisioning::saveConfig(
    const String& ssid,
    const String& password,
    const String& telemetryUrl,
    const String& deviceToken) {
  if (!prefs_.begin(kPrefsNamespace, false)) {
    Serial.println("[PROVISION] ERROR: could not open NVS for writing.");
    return;
  }

  prefs_.putString(kKeySsid, ssid);
  prefs_.putString(kKeyPassword, password);
  prefs_.putString(kKeyApiUrl, telemetryUrl);
  prefs_.putString(kKeyToken, deviceToken);
  prefs_.end();

  // Update RAM copy without ever printing secret values.
  ssid_ = ssid;
  password_ = password;
  telemetryUrl_ = telemetryUrl;
  deviceToken_ = deviceToken;
}

bool SmartTankProvisioning::tryStation(uint32_t timeoutMs) {
  const String hostname = "smart-tank-" + deviceId().substring(6);

  WiFi.mode(WIFI_MODE_NULL);
  delay(50);
  WiFi.setHostname(hostname.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  Serial.printf("[WiFi] Connecting to saved network: %s\n", ssid_.c_str());
  WiFi.begin(ssid_.c_str(), password_.c_str());

  const uint32_t started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < timeoutMs) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    portalActive_ = false;
    Serial.printf("[WiFi] Connected. IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  }

  Serial.println("[WiFi] Saved network unavailable. Entering provisioning mode.");
  return false;
}

String SmartTankProvisioning::htmlEscape(const String& input) const {
  String out;
  out.reserve(input.length() + 16);
  for (size_t i = 0; i < input.length(); ++i) {
    switch (input[i]) {
      case '&': out += F("&amp;"); break;
      case '<': out += F("&lt;"); break;
      case '>': out += F("&gt;"); break;
      case '"': out += F("&quot;"); break;
      case '\'': out += F("&#39;"); break;
      default: out += input[i]; break;
    }
  }
  return out;
}

void SmartTankProvisioning::handleRoot() {
  String options;
  const int networks = WiFi.scanNetworks(false, true);
  if (networks > 0) {
    for (int i = 0; i < networks; ++i) {
      const String network = WiFi.SSID(i);
      if (network.isEmpty()) continue;
      options += "<option value=\"" + htmlEscape(network) + "\"></option>";
    }
  }
  WiFi.scanDelete();

  const String safeSsid = htmlEscape(ssid_);
  const String safeUrl = htmlEscape(telemetryUrl_);

  String html = F(
      "<!doctype html><html><head>"
      "<meta name='viewport' content='width=device-width,initial-scale=1'>"
      "<title>Smart Tank Setup</title>"
      "<style>body{font-family:system-ui;max-width:620px;margin:32px auto;padding:0 18px}"
      "label{display:block;margin-top:14px;font-weight:600}"
      "input{width:100%;box-sizing:border-box;padding:10px;margin-top:6px}"
      "button{margin-top:18px;padding:11px 18px}"
      ".note{background:#f3f4f6;padding:12px;border-radius:8px}</style></head><body>"
      "<h1>Smart Tank Setup</h1>"
      "<p class='note'>This page is local to the ESP32 setup network. "
      "Saved passwords/tokens are never displayed back.</p>"
      "<form method='POST' action='/save'>"
      "<label>Wi-Fi SSID</label>"
      "<input list='networks' name='ssid' maxlength='32' required value='");

  html += safeSsid;
  html += F("'><datalist id='networks'>");
  html += options;
  html += F(
      "</datalist>"
      "<label>Wi-Fi password</label>"
      "<input type='password' name='pass' maxlength='63' autocomplete='new-password' "
      "placeholder='leave blank only for an open network'>"
      "<label>Telemetry URL (optional until web/API session)</label>"
      "<input name='api_url' maxlength='180' value='");
  html += safeUrl;
  html += F(
      "' placeholder='https://your-app.example/api/telemetry'>"
      "<label>Device ingest token (optional until API session)</label>"
      "<input type='password' name='token' maxlength='180' autocomplete='new-password'>"
      "<button type='submit'>Save and restart</button>"
      "</form>"
      "<p>Device: ");
  html += htmlEscape(deviceId());
  html += F("</p></body></html>");

  server_.send(200, "text/html; charset=utf-8", html);
}

void SmartTankProvisioning::handleSave() {
  String ssid = server_.arg("ssid");
  String password = server_.arg("pass");
  String apiUrl = server_.arg("api_url");
  String token = server_.arg("token");

  ssid.trim();
  apiUrl.trim();
  token.trim();

  if (ssid.isEmpty() || ssid.length() > 32) {
    server_.send(400, "text/plain", "Invalid SSID.");
    return;
  }

  if (!password.isEmpty() && (password.length() < 8 || password.length() > 63)) {
    server_.send(400, "text/plain",
                 "Wi-Fi password must be empty for an open network or 8-63 characters.");
    return;
  }

  if (!apiUrl.isEmpty() &&
      !(apiUrl.startsWith("http://") || apiUrl.startsWith("https://"))) {
    server_.send(400, "text/plain", "Telemetry URL must start with http:// or https://.");
    return;
  }

  saveConfig(ssid, password, apiUrl, token);

  Serial.printf("[PROVISION] Configuration saved for SSID: %s\n", ssid.c_str());
  Serial.println("[PROVISION] Password/token intentionally not logged.");
  server_.send(
      200, "text/html; charset=utf-8",
      "<!doctype html><html><body><h2>Saved.</h2>"
      "<p>Smart Tank will restart and attempt the configured Wi-Fi.</p></body></html>");

  delay(1200);
  ESP.restart();
}

void SmartTankProvisioning::handleNotFound() {
  // Wildcard DNS + this route gives a simple captive-portal behavior.
  handleRoot();
}

void SmartTankProvisioning::installRoutes() {
  if (routesInstalled_) return;

  server_.on("/", HTTP_GET, [this]() { handleRoot(); });
  server_.on("/save", HTTP_POST, [this]() { handleSave(); });

  // Common captive-portal probe paths.
  server_.on("/generate_204", HTTP_GET, [this]() { handleRoot(); });
  server_.on("/hotspot-detect.html", HTTP_GET, [this]() { handleRoot(); });
  server_.on("/ncsi.txt", HTTP_GET, [this]() { handleRoot(); });
  server_.on("/connecttest.txt", HTTP_GET, [this]() { handleRoot(); });

  server_.onNotFound([this]() { handleNotFound(); });
  routesInstalled_ = true;
}

void SmartTankProvisioning::startPortal() {
  if (portalActive_) return;

  WiFi.disconnect(true, false);
  delay(100);
  WiFi.mode(WIFI_AP_STA);

  apSsid_ = "SmartTank-Setup-" + deviceId().substring(6);
  apPassword_ = makeOneTimePassword();

  WiFi.softAPConfig(kPortalIp, kPortalGateway, kPortalSubnet);
  if (!WiFi.softAP(apSsid_.c_str(), apPassword_.c_str(), 1, false, 2)) {
    Serial.println("[PROVISION] ERROR: SoftAP creation failed.");
    return;
  }

  installRoutes();
  dns_.start(53, "*", kPortalIp);
  server_.begin();
  portalActive_ = true;

  Serial.println("[PROVISION] Portal active");
  Serial.printf("[PROVISION] SSID: %s\n", apSsid_.c_str());
  Serial.printf("[PROVISION] Password: %s\n", apPassword_.c_str());
  Serial.printf("[PROVISION] Portal: http://%s\n",
                WiFi.softAPIP().toString().c_str());
  Serial.println("[PROVISION] The setup password is temporary and not saved to source.");
}

bool SmartTankProvisioning::begin(uint32_t stationTimeoutMs) {
  if (loadConfig() && tryStation(stationTimeoutMs)) {
    return true;
  }

  startPortal();
  return false;
}

void SmartTankProvisioning::pollSerial() {
  while (Serial.available()) {
    const char c = static_cast<char>(Serial.read());
    if (c == '\r') continue;

    if (c == '\n') {
      serialLine_.trim();
      serialLine_.toUpperCase();

      if (serialLine_ == "PROVISION") {
        Serial.println("[PROVISION] Manual re-provisioning requested.");
        startPortal();
      } else if (serialLine_ == "CLEAR_WIFI") {
        clearAllAndRestart();
      }

      serialLine_ = "";
      continue;
    }

    if (serialLine_.length() < 64) {
      serialLine_ += c;
    }
  }
}

void SmartTankProvisioning::loop() {
  pollSerial();

  if (portalActive_) {
    dns_.processNextRequest();
    server_.handleClient();
  }
}

void SmartTankProvisioning::clearAllAndRestart() {
  Serial.println("[PROVISION] Clearing Smart Tank provisioning data.");
  if (prefs_.begin(kPrefsNamespace, false)) {
    prefs_.clear();
    prefs_.end();
  }

  // Also erase any Arduino Wi-Fi driver's remembered AP state.
  WiFi.disconnect(true, true);
  delay(300);
  ESP.restart();
}

bool SmartTankProvisioning::isConnected() const {
  return WiFi.status() == WL_CONNECTED;
}

bool SmartTankProvisioning::isPortalActive() const {
  return portalActive_;
}

String SmartTankProvisioning::deviceId() const {
  return makeDeviceId();
}

String SmartTankProvisioning::portalSsid() const {
  return apSsid_;
}

String SmartTankProvisioning::telemetryUrl() const {
  return telemetryUrl_;
}

String SmartTankProvisioning::deviceToken() const {
  return deviceToken_;
}
