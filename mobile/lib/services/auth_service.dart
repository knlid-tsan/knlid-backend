import 'package:dio/dio.dart';
import 'api_client.dart';
import '../models/city.dart';

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

  /// Login — verify OTP for an EXISTING user. Throws [String] on error.
  /// Returns JWT access token.
  Future<String> verifyOtp({
    required String phone,
    required String code,
  }) async {
    try {
      final response = await _client.dio.post('/auth/verify-otp', data: {
        'phone': phone,
        'code': code,
      });
      return response.data['access_token'] as String;
    } on DioException catch (e) {
      throw _message(e);
    }
  }

  /// Register — create a new specialist account and return JWT.
  Future<String> register({
    required String phone,
    required String code,
    required String fullName,
    required String specialization,
    required String city,
  }) async {
    try {
      final response = await _client.dio.post('/auth/register', data: {
        'phone': phone,
        'code': code,
        'full_name': fullName,
        'specialization': specialization,
        'city': city,
      });
      return response.data['access_token'] as String;
    } on DioException catch (e) {
      throw _message(e);
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
