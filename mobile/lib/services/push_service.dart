import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import '../screens/lead_detail_screen.dart';
import 'api_client.dart';
import 'navigator_key.dart';

/// Push-уведомления (FCM): инициализация, разрешение, регистрация токена
/// на API, обработка тапа по пушу.
///
/// Устойчив к отсутствию Firebase-конфигов (google-services.json /
/// GoogleService-Info.plist): без них просто пишет в лог и выключается,
/// приложение работает как раньше.
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  bool _initialized = false;
  String? _currentToken;

  /// Вызывать после успешного входа (главный экран).
  Future<void> init() async {
    if (_initialized) {
      // Повторный вход — просто перерегистрируем токен
      await _registerToken();
      return;
    }
    try {
      await Firebase.initializeApp();
    } catch (e) {
      debugPrint('PushService: Firebase не сконфигурирован ($e) — пуши выключены');
      return;
    }
    _initialized = true;

    final messaging = FirebaseMessaging.instance;

    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('PushService: разрешение на уведомления отклонено');
      return;
    }

    await _registerToken();
    messaging.onTokenRefresh.listen((_) => _registerToken());

    // Тап по пушу, когда приложение было в фоне
    FirebaseMessaging.onMessageOpenedApp.listen(_handleTap);
    // Приложение было закрыто и открыто тапом по пушу
    final initial = await messaging.getInitialMessage();
    if (initial != null) _handleTap(initial);
  }

  Future<void> _registerToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token == _currentToken) return;
      await ApiClient().dio.post('/notifications/device', data: {
        'token': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
      });
      _currentToken = token;
      debugPrint('PushService: токен зарегистрирован');
    } catch (e) {
      debugPrint('PushService: не удалось зарегистрировать токен ($e)');
    }
  }

  /// Вызывать при logout: отвязать токен от аккаунта.
  Future<void> unregister() async {
    final token = _currentToken;
    if (token == null) return;
    try {
      await ApiClient().dio.delete('/notifications/device', data: {
        'token': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
      });
    } catch (_) {}
    _currentToken = null;
  }

  void _handleTap(RemoteMessage message) {
    final leadId = message.data['lead_id'] as String?;
    if (leadId == null || leadId.isEmpty) return;
    navigatorKey.currentState?.push(
      MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: leadId)),
    );
  }
}
