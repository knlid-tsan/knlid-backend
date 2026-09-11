import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

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

  // Показ уведомлений при открытом приложении (Android): FCM в foreground
  // не рисует системное уведомление сам — показываем через локальные
  final _localNotifications = FlutterLocalNotificationsPlugin();
  static const _androidChannel = AndroidNotificationChannel(
    'knlid_default',
    'Уведомления KN.LID',
    description: 'Лиды, статусы и события платформы',
    importance: Importance.high,
  );

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

    // Уведомления при открытом приложении:
    // iOS умеет показывать их системно, Android — только через локальные
    if (Platform.isIOS) {
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    } else {
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_androidChannel);
      await _localNotifications.initialize(
        settings: const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        ),
        onDidReceiveNotificationResponse: (response) =>
            _openLead(response.payload),
      );
      FirebaseMessaging.onMessage.listen(_showForegroundNotification);
    }

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

  void _showForegroundNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;
    _localNotifications.show(
      id: notification.hashCode,
      title: notification.title,
      body: notification.body,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannel.id,
          _androidChannel.name,
          channelDescription: _androidChannel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      payload: message.data['lead_id'] as String?,
    );
  }

  void _handleTap(RemoteMessage message) {
    _openLead(message.data['lead_id'] as String?);
  }

  void _openLead(String? leadId) {
    if (leadId == null || leadId.isEmpty) return;
    navigatorKey.currentState?.push(
      MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: leadId)),
    );
  }
}
