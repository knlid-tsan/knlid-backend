import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocaleService {
  static const _storage = FlutterSecureStorage();
  static const _key = 'app_locale';

  static Future<Locale> load() async {
    final code = await _storage.read(key: _key);
    return Locale(code ?? 'ru');
  }

  static Future<void> save(Locale locale) async {
    await _storage.write(key: _key, value: locale.languageCode);
  }
}
