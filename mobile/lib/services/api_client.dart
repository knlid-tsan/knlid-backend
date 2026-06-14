import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config.dart';

/// Singleton Dio client. Automatically attaches the JWT Bearer token to every
/// request via an interceptor. Token is stored in the platform secure storage
/// (iOS Keychain / Android Keystore).
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  static const _tokenKey = 'knlid_jwt';

  late final Dio dio;

  final _storage = const FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      contentType: 'application/json',
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ));
  }

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  /// Returns true when a JWT is stored and its `exp` claim is in the future.
  Future<bool> hasValidToken() async {
    final token = await getToken();
    if (token == null) return false;
    try {
      final payload = decodeTokenPayload(token);
      final exp = payload['exp'] as int?;
      if (exp == null) return false;
      return DateTime.fromMillisecondsSinceEpoch(exp * 1000).isAfter(DateTime.now());
    } catch (_) {
      return false;
    }
  }

  /// Decodes the JWT payload without verifying the signature.
  Map<String, dynamic> decodeTokenPayload(String token) {
    final parts = token.split('.');
    if (parts.length != 3) throw const FormatException('Invalid JWT format');
    final normalized = base64Url.normalize(parts[1]);
    return json.decode(utf8.decode(base64Url.decode(normalized)))
        as Map<String, dynamic>;
  }
}
