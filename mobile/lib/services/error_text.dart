import 'package:dio/dio.dart';

/// Человекочитаемый текст ошибки вместо технического
/// «DioException [bad response]…». Серверные message-тексты уже на русском —
/// используются как есть; остальное сводится к понятным формулировкам.
String humanError(Object e) {
  if (e is DioException) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return 'Нет соединения. Проверьте интернет и попробуйте снова';
      default:
        break;
    }
    final code = e.response?.statusCode;
    final data = e.response?.data;
    if (data is Map) {
      final msg = data['message'];
      if (msg is String && msg.isNotEmpty) return msg;
      if (msg is List && msg.isNotEmpty) return msg.first.toString();
    }
    if (code == 401) return 'Сессия истекла. Войдите заново';
    if (code != null && code >= 500) {
      return 'Сервер временно недоступен. Попробуйте позже';
    }
  }
  return 'Что-то пошло не так. Попробуйте ещё раз';
}
