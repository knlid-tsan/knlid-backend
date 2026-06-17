import 'package:flutter/foundation.dart';

class AppConfig {
  static const String apiBaseUrl = kReleaseMode
      ? 'https://api.lid.kn.kz'
      : 'http://localhost:3000';
}
