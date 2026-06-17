import '../models/app_notification.dart';
import 'api_client.dart';

class NotificationsService {
  final _dio = ApiClient().dio;

  Future<List<AppNotification>> getMyNotifications({int limit = 50}) async {
    final res = await _dio.get(
      '/notifications/my',
      queryParameters: {'page': 1, 'limit': limit},
    );
    final items = (res.data as Map<String, dynamic>)['items'] as List;
    return items
        .map((j) => AppNotification.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<void> markAllRead() async {
    await _dio.post('/notifications/read-all');
  }

  Future<void> markRead(String id) async {
    await _dio.post('/notifications/$id/read');
  }

  // Fetches up to 100 notifications and counts unread locally
  Future<int> getUnreadCount() async {
    final res = await _dio.get(
      '/notifications/my',
      queryParameters: {'page': 1, 'limit': 100},
    );
    final items = (res.data as Map<String, dynamic>)['items'] as List;
    return items
        .where((j) => !(j['is_read'] as bool? ?? false))
        .length;
  }
}
