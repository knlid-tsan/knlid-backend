class SupportMessage {
  final String id;
  final String conversationId;
  final String senderType; // 'user' | 'support'
  final String? senderId;
  final String text;
  final DateTime createdAt;
  final bool isRead;

  const SupportMessage({
    required this.id,
    required this.conversationId,
    required this.senderType,
    this.senderId,
    required this.text,
    required this.createdAt,
    required this.isRead,
  });

  factory SupportMessage.fromJson(Map<String, dynamic> j) => SupportMessage(
        id: j['id'] as String,
        conversationId: j['conversation_id'] as String,
        senderType: j['sender_type'] as String,
        senderId: j['sender_id'] as String?,
        text: j['text'] as String,
        createdAt: DateTime.parse(j['created_at'] as String),
        isRead: j['is_read'] as bool? ?? false,
      );
}
