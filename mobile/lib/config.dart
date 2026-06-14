/// API base URL configuration.
///
/// iOS Simulator  → localhost resolves to Mac directly, no change needed.
/// Android Emulator → change to http://10.0.2.2:3000
/// Physical device  → change to http://<Mac-local-IP>:3000
class AppConfig {
  static const String apiBaseUrl = 'http://localhost:3000';
}
