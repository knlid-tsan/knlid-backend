import 'package:dio/dio.dart';
import 'api_client.dart';
import '../models/city.dart';

/// Thrown when the backend responds 400 indicating a new user must supply
/// registration fields before the token can be issued.
class RegistrationRequiredException implements Exception {
  const RegistrationRequiredException();
}

class AuthService {
  final _client = ApiClient();

  /// Step 1 — request an OTP for [phone].
  Future<void> requestOtp(String phone) async {
    try {
      await _client.dio.post('/auth/request-otp', data: {'phone': phone});
    } on DioException catch (e) {
      throw _message(e);
    }
  }

  /// Step 2 — verify OTP and obtain a JWT.
  ///
  /// For existing users pass only [phone] + [code].
  /// For new users pass all fields; the backend creates the account and returns
  /// a token in one call.
  ///
  /// Throws [RegistrationRequiredException] when the user is new and
  /// registration fields are missing.
  /// Throws [String] with a human-readable error in all other failure cases.
  Future<String> verifyOtp({
    required String phone,
    required String code,
    String? fullName,
    String? specialization,
    String? city,
  }) async {
    try {
      final response = await _client.dio.post('/auth/verify-otp', data: {
        'phone': phone,
        'code': code,
        if (fullName != null) 'full_name': fullName,
        if (specialization != null) 'specialization': specialization,
        if (city != null) 'city': city,
      });
      return response.data['access_token'] as String;
    } on DioException catch (e) {
      final msg = _message(e);
      if (e.response?.statusCode == 400 && msg.contains('регистрации')) {
        throw const RegistrationRequiredException();
      }
      throw msg;
    }
  }

  /// Fetches the list of active cities (public endpoint, no token required).
  Future<List<City>> getCities() async {
    try {
      final response = await _client.dio.get('/cities');
      return (response.data as List)
          .map((e) => City.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _message(e);
    }
  }

  String _message(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError) {
      return 'Сервер недоступен. Проверьте подключение';
    }
    final data = e.response?.data;
    if (data is Map) {
      final msg = data['message'];
      if (msg is String) return msg;
      if (msg is List && msg.isNotEmpty) return msg.first.toString();
    }
    return 'Ошибка ${e.response?.statusCode ?? "сети"}';
  }
}
