import 'package:flutter/material.dart';

// ─── Labels & colours ────────────────────────────────────────────────────────

const leadTypeLabels = {
  'owner': 'Собственник',
  'buyer': 'Покупатель',
  'mortgage': 'Ипотека',
  'legal': 'Юрист',
};

const leadStatusLabels = {
  'new': 'Новый',
  'pending_acceptance': 'Ожидает принятия',
  'in_progress': 'В работе',
  'contract': 'Договор',
  'deposit': 'Задаток',
  'closed_success': 'Закрыт успешно',
  'cancelled': 'Отменён',
  'dispute': 'Спор',
  'archived': 'Архив',
};

Color leadStatusColor(String status) {
  switch (status) {
    case 'closed_success':
      return const Color(0xFF22C55E);
    case 'in_progress':
    case 'contract':
    case 'deposit':
      return const Color(0xFF3B82F6);
    case 'new':
    case 'pending_acceptance':
      return const Color(0xFFF59E0B);
    case 'dispute':
      return const Color(0xFFDC2626);
    default:
      return const Color(0xFF94A3B8);
  }
}

String formatLeadDate(DateTime dt) {
  const months = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
  ];
  return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
}

// ─── Models ──────────────────────────────────────────────────────────────────

class LeadClient {
  final String id;
  final String fullName;
  final String city;
  final String? phone;

  const LeadClient({
    required this.id,
    required this.fullName,
    required this.city,
    this.phone,
  });

  factory LeadClient.fromJson(Map<String, dynamic> j) => LeadClient(
        id: j['id'] as String,
        fullName: j['full_name'] as String,
        city: j['city'] as String,
        phone: j['phone'] as String?,
      );
}

class StatusHistoryItem {
  final String? fromStatus;
  final String toStatus;
  final String? comment;
  final DateTime createdAt;

  const StatusHistoryItem({
    this.fromStatus,
    required this.toStatus,
    this.comment,
    required this.createdAt,
  });

  factory StatusHistoryItem.fromJson(Map<String, dynamic> j) =>
      StatusHistoryItem(
        fromStatus: j['from_status'] as String?,
        toStatus: j['to_status'] as String,
        comment: j['comment'] as String?,
        createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
      );
}

class LeadGuarantor {
  final bool active;
  final String companyName;

  const LeadGuarantor({required this.active, required this.companyName});

  factory LeadGuarantor.fromJson(Map<String, dynamic> j) => LeadGuarantor(
        active: j['active'] as bool,
        companyName: j['company_name'] as String,
      );
}

class Lead {
  final String id;
  final String type;
  final String status;
  final String city;
  final String description;
  final String authorId;
  final String? executorId;
  final String? rewardAmount;
  final bool rewardPaid;
  final DateTime createdAt;
  final DateTime? closedAt;
  final LeadClient? client;
  // Only present in GET /leads/:id response
  final List<StatusHistoryItem>? history;
  final LeadGuarantor? guarantor;

  const Lead({
    required this.id,
    required this.type,
    required this.status,
    required this.city,
    required this.description,
    required this.authorId,
    this.executorId,
    this.rewardAmount,
    required this.rewardPaid,
    required this.createdAt,
    this.closedAt,
    this.client,
    this.history,
    this.guarantor,
  });

  factory Lead.fromJson(Map<String, dynamic> j) {
    final rawHistory = j['history'];
    final rawGuarantor = j['guarantor'];
    final rawClient = j['client'];

    return Lead(
      id: j['id'] as String,
      type: j['type'] as String,
      status: j['status'] as String,
      city: j['city'] as String,
      description: j['description'] as String,
      authorId: j['author_id'] as String,
      executorId: j['executor_id'] as String?,
      rewardAmount: j['reward_amount'] as String?,
      rewardPaid: j['reward_paid'] as bool? ?? false,
      createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
      closedAt: j['closed_at'] != null
          ? DateTime.parse(j['closed_at'] as String).toLocal()
          : null,
      client: rawClient != null
          ? LeadClient.fromJson(rawClient as Map<String, dynamic>)
          : null,
      history: rawHistory != null
          ? (rawHistory as List)
              .map((h) => StatusHistoryItem.fromJson(h as Map<String, dynamic>))
              .toList()
          : null,
      guarantor: rawGuarantor != null
          ? LeadGuarantor.fromJson(rawGuarantor as Map<String, dynamic>)
          : null,
    );
  }
}
