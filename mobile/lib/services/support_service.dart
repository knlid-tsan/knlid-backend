import '../models/support_message.dart';
import 'api_client.dart';

class SupportService {
  final _dio = ApiClient().dio;

  Future<List<SupportMessage>> getConversation() async {
    final res = await _dio.get('/support/conversation');
    final data = res.data as Map<String, dynamic>;
    final msgs = data['messages'] as List;
    return msgs
        .map((j) => SupportMessage.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<SupportMessage> sendMessage(String text) async {
    final res = await _dio.post('/support/message', data: {'text': text});
    return SupportMessage.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> markRead() async {
    await _dio.post('/support/read');
  }

  Future<int> getUnread() async {
    final res = await _dio.get('/support/unread');
    return (res.data as Map<String, dynamic>)['count'] as int? ?? 0;
  }
}
