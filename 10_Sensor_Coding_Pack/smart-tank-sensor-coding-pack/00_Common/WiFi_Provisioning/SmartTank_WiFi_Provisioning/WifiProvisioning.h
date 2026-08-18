#pragma once

#include <Arduino.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <WebServer.h>
#include <WiFi.h>

class SmartTankProvisioning {
 public:
  SmartTankProvisioning();

  // Returns true when station mode is connected after begin().
  // Returns false when the local provisioning portal is active.
  bool begin(uint32_t stationTimeoutMs = 15000);

  // Call frequently from loop() so captive portal + Serial recovery commands work.
  void loop();

  bool isConnected() const;
  bool isPortalActive() const;

  String deviceId() const;
  String portalSsid() const;
  String telemetryUrl() const;
  String deviceToken() const;

  // Opens the portal without deleting current saved values.
  void startPortal();

  // Clears Smart Tank configuration and restarts into first-boot provisioning.
  void clearAllAndRestart();

 private:
  Preferences prefs_;
  DNSServer dns_;
  WebServer server_;

  bool portalActive_ = false;
  bool routesInstalled_ = false;

  String ssid_;
  String password_;
  String telemetryUrl_;
  String deviceToken_;

  String apSsid_;
  String apPassword_;
  String serialLine_;

  bool loadConfig();
  bool tryStation(uint32_t timeoutMs);
  void installRoutes();
  void handleRoot();
  void handleSave();
  void handleNotFound();
  void pollSerial();

  String makeDeviceId() const;
  String makeOneTimePassword() const;
  String htmlEscape(const String& input) const;
  void saveConfig(const String& ssid,
                  const String& password,
                  const String& telemetryUrl,
                  const String& deviceToken);
};
