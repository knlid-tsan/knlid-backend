import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/api_client.dart';

// ─── Labels ──────────────────────────────────────────────────────────────────

const _specializationLabels = {
  'realtor': 'Риелтор',
  'mortgage': 'Ипотечный брокер',
  'lawyer': 'Юрист',
};

const _statusLabels = {
  'new': 'Не верифицирован',
  'pending': 'На проверке',
  'active': 'Подтверждён',
  'blocked': 'Заблокирован',
  'archived': 'Архив',
};

const _statusColors = {
  'active': Color(0xFF22C55E),
  'pending': Color(0xFFF59E0B),
  'new': Color(0xFF94A3B8),
  'blocked': Color(0xFFDC2626),
  'archived': Color(0xFF94A3B8),
};

const _roleLabels = {
  'user': 'Специалист',
  'admin': 'Администратор',
  'moderator': 'Модератор',
  'company': 'Компания',
};

// ─── Screen ──────────────────────────────────────────────────────────────────

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _client = ApiClient();

  Map<String, dynamic>? _user;
  String? _guarantorName;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final userRes = await _client.dio.get('/users/me');
      final user = userRes.data as Map<String, dynamic>;

      String? guarantorName;
      if (user['role'] == 'user') {
        try {
          final membershipsRes = await _client.dio.get('/memberships/my');
          final memberships = membershipsRes.data as List;
          final active = memberships.firstWhere(
            (m) => m['status'] == 'active',
            orElse: () => null,
          );
          if (active != null) {
            guarantorName = active['company_name'] as String?;
          }
        } catch (_) {
          // Non-critical: memberships call failure doesn't block profile
        }
      }

      setState(() {
        _user = user;
        _guarantorName = guarantorName;
      });
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      setState(() => _error =
          msg is String ? msg : 'Ошибка ${e.response?.statusCode ?? "сети"}');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await _client.clearToken();
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(context, '/phone', (r) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!,
                  style: const TextStyle(
                      fontSize: 13, color: Color(0xFF64748B)),
                  textAlign: TextAlign.center),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Повторить'),
              ),
            ],
          ),
        ),
      );
    }

    final user = _user!;
    final role = user['role'] as String? ?? '';
    final isSpecialist = role == 'user';
    final status = user['status'] as String? ?? '';
    final statusLabel = _statusLabels[status] ?? status;
    final statusColor = _statusColors[status] ?? const Color(0xFF94A3B8);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        children: [
          // Header
          const Text(
            'Профиль',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 20),

          // Verification status banner (for specialists)
          if (isSpecialist) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: statusColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    statusLabel,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            if (status == 'pending' || status == 'new') ...[
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 2),
                child: Text(
                  'Для создания лидов необходима верификация. '
                  'Загрузите документ в разделе «Верификация».',
                  style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
              ),
            ],
            const SizedBox(height: 16),
          ],

          // Main info card
          _Card(children: [
            if ((user['full_name'] as String?)?.isNotEmpty == true) ...[
              _NameRow(user['full_name'] as String),
              const SizedBox(height: 12),
            ],
            if (isSpecialist &&
                user['specialization'] != null &&
                (user['specialization'] as String).isNotEmpty)
              _InfoRow(
                  'Специализация',
                  _specializationLabels[user['specialization']] ??
                      user['specialization'] as String),
            if (!isSpecialist)
              _InfoRow('Роль', _roleLabels[role] ?? role),
            if ((user['city'] as String?)?.isNotEmpty == true)
              _InfoRow('Город', user['city'] as String),
            _InfoRow('Телефон', user['phone'] as String? ?? ''),
          ]),

          // Guarantor
          if (_guarantorName != null) ...[
            const SizedBox(height: 12),
            _Card(children: [
              _InfoRow('Гарант', _guarantorName!,
                  valueStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF3B82F6),
                  )),
            ]),
          ],

          // Stats (specialist only)
          if (isSpecialist) ...[
            const SizedBox(height: 12),
            _StatsCard(
              rating: _parseDecimal(user['rating']),
              sent: (user['leads_sent'] as int?) ?? 0,
              received: (user['leads_received'] as int?) ?? 0,
              closed: (user['leads_closed'] as int?) ?? 0,
            ),
          ],

          const SizedBox(height: 28),
          OutlinedButton(
            onPressed: _logout,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Выйти',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  double _parseDecimal(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

// ─── Private widgets ──────────────────────────────────────────────────────────

class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

class _NameRow extends StatelessWidget {
  final String name;
  const _NameRow(this.name);

  @override
  Widget build(BuildContext context) {
    return Text(
      name,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Color(0xFF1E293B),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final TextStyle? valueStyle;

  const _InfoRow(this.label, this.value, {this.valueStyle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style:
                  const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: valueStyle ??
                  const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF1E293B),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsCard extends StatelessWidget {
  final double rating;
  final int sent;
  final int received;
  final int closed;

  const _StatsCard({
    required this.rating,
    required this.sent,
    required this.received,
    required this.closed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Статистика',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF94A3B8),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _Stat(
                value: rating.toStringAsFixed(1),
                label: 'Рейтинг',
                icon: Icons.star_outline,
                color: const Color(0xFFF59E0B),
              ),
              _Stat(value: '$sent', label: 'Передано', icon: Icons.send_outlined),
              _Stat(
                  value: '$received',
                  label: 'Принято',
                  icon: Icons.assignment_outlined),
              _Stat(
                  value: '$closed',
                  label: 'Закрыто',
                  icon: Icons.check_circle_outline,
                  color: const Color(0xFF22C55E)),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color? color;

  const _Stat({
    required this.value,
    required this.label,
    required this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? const Color(0xFF64748B);
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 20, color: c),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.bold, color: c),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }
}
