import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_client.dart';
import '../services/phone_formatter.dart';
import '../config.dart';
import 'verification_screen.dart';
import 'payment_form_screen.dart';

// ─── Labels ──────────────────────────────────────────────────────────────────

const _specializationLabels = {
  'realtor': 'Риелтор',
  'mortgage': 'Ипотечный брокер',
  'lawyer': 'Юрист',
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
  final _picker = ImagePicker();

  Map<String, dynamic>? _user;
  String? _guarantorName;
  String? _paymentBankName;
  bool _loading = true;
  bool _avatarUploading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
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
          if (active != null) guarantorName = active['company_name'] as String?;
        } catch (_) {}
      }

      String? paymentBankName;
      if (user['payment_bank_id'] != null) {
        try {
          final banksRes = await _client.dio.get('/banks');
          final banks = banksRes.data as List;
          final match = banks.cast<Map<String, dynamic>>().firstWhere(
            (b) => b['id'] == user['payment_bank_id'],
            orElse: () => <String, dynamic>{},
          );
          if (match.isNotEmpty) paymentBankName = match['name'] as String?;
        } catch (_) {}
      }

      setState(() {
        _user = user;
        _guarantorName = guarantorName;
        _paymentBankName = paymentBankName;
      });
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      setState(() => _error = msg is String ? msg : 'Ошибка ${e.response?.statusCode ?? "сети"}');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickAvatar() async {
    final choice = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Камера'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Галерея'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (choice == null) return;

    final XFile? file = await _picker.pickImage(
      source: choice,
      imageQuality: 80,
      maxWidth: 512,
    );
    if (file == null) return;

    setState(() => _avatarUploading = true);
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: file.name),
      });
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/users/me/avatar',
        data: formData,
      );
      // Update avatar URL directly from server response, then refresh full profile
      if (mounted && response.data != null) {
        final avatarUrl = response.data!['avatar_url'] as String?;
        if (avatarUrl != null) {
          setState(() => _user = {...?_user, 'avatar_url': avatarUrl});
        }
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      String msg = 'Ошибка загрузки фото';
      if (e is DioException) {
        final data = e.response?.data;
        if (data is Map && data['message'] is String) {
          msg = data['message'] as String;
        } else if (e.response?.statusCode == 403) {
          msg = 'Нет прав для загрузки аватара';
        }
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: const Color(0xFFDC2626)),
      );
    } finally {
      if (mounted) setState(() => _avatarUploading = false);
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
    if (_loading) return const Center(child: CircularProgressIndicator());

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
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
    final rejectionReason = user['verification_rejection_reason'] as String?;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        children: [
          const Text(
            'Профиль',
            style: TextStyle(
              fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 20),

          // ── Аватар ──
          Center(
            child: Column(
              children: [
                _AvatarWidget(
                  avatarUrl: user['avatar_url'] as String?,
                  uploading: _avatarUploading,
                  onTap: _pickAvatar,
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _avatarUploading ? null : _pickAvatar,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  ),
                  child: Text(
                    user['avatar_url'] != null ? 'Изменить фото' : 'Добавить фото',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF3B82F6)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Блок верификации (только для специалистов) ──
          if (isSpecialist) ...[
            _VerificationBlock(
              status: status,
              rejectionReason: rejectionReason,
              onGoToVerification: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const VerificationScreen(),
                  ),
                );
                _load();
              },
            ),
            const SizedBox(height: 12),
            _PaymentBlock(
              bankName: _paymentBankName,
              paymentPhone: user['payment_phone'] as String?,
              userPhone: user['phone'] as String,
              onSaved: _load,
            ),
            const SizedBox(height: 16),
          ],

          // ── Основная информация ──
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
                    user['specialization'] as String,
              ),
            if (!isSpecialist)
              _InfoRow('Роль', _roleLabels[role] ?? role),
            if ((user['city'] as String?)?.isNotEmpty == true)
              _InfoRow('Город', user['city'] as String),
            _InfoRow('Телефон', formatPhone(user['phone'] as String?)),
          ]),

          // ── Гарант ──
          if (_guarantorName != null) ...[
            const SizedBox(height: 12),
            _Card(children: [
              _InfoRow('Гарант', _guarantorName!,
                  valueStyle: const TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w500,
                    color: Color(0xFF3B82F6),
                  )),
            ]),
          ],

          // ── Статистика ──
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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text(
              'Выйти',
              style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w500),
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

// ─── Avatar widget ────────────────────────────────────────────────────────────

class _AvatarWidget extends StatelessWidget {
  final String? avatarUrl;
  final bool uploading;
  final VoidCallback onTap;

  const _AvatarWidget({
    required this.avatarUrl,
    required this.uploading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: uploading ? null : onTap,
      child: Stack(
        children: [
          CircleAvatar(
            radius: 44,
            backgroundColor: const Color(0xFFE2E8F0),
            backgroundImage: avatarUrl != null
                ? NetworkImage('${AppConfig.apiBaseUrl}/$avatarUrl')
                : null,
            child: avatarUrl == null
                ? const Icon(Icons.person, size: 44, color: Color(0xFF94A3B8))
                : null,
          ),
          if (uploading)
            const Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.black26,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: SizedBox(
                    width: 24, height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  ),
                ),
              ),
            ),
          // Иконка-карандаш
          Positioned(
            bottom: 0, right: 0,
            child: Container(
              width: 28, height: 28,
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.edit, size: 14, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Verification block ───────────────────────────────────────────────────────

class _VerificationBlock extends StatelessWidget {
  final String status;
  final String? rejectionReason;
  final VoidCallback onGoToVerification;

  const _VerificationBlock({
    required this.status,
    required this.rejectionReason,
    required this.onGoToVerification,
  });

  @override
  Widget build(BuildContext context) {
    final isRejected = status == 'new' && rejectionReason != null;
    final isNotStarted = status == 'new' && rejectionReason == null;
    final isPending = status == 'pending';
    final isActive = status == 'active';

    final Color color;
    final IconData icon;
    final String label;

    if (isActive) {
      color = const Color(0xFF22C55E);
      icon = Icons.verified_outlined;
      label = 'Верифицированы ✓';
    } else if (isPending) {
      color = const Color(0xFFF59E0B);
      icon = Icons.hourglass_top_outlined;
      label = 'Фото на проверке';
    } else if (isRejected) {
      color = const Color(0xFFDC2626);
      icon = Icons.cancel_outlined;
      label = 'Верификация отклонена';
    } else {
      color = const Color(0xFF94A3B8);
      icon = Icons.badge_outlined;
      label = 'Не верифицированы';
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w600, fontSize: 14, color: color,
                ),
              ),
            ],
          ),

          // Причина отклонения
          if (isRejected && rejectionReason != null) ...[
            const SizedBox(height: 6),
            Text(
              'Причина: $rejectionReason',
              style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C)),
            ),
          ],

          // CTA-кнопка
          if (isNotStarted || isRejected) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onGoToVerification,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: color),
                  foregroundColor: color,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  isRejected ? 'Загрузить заново →' : 'Пройти верификацию →',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],

          // Подсказка для pending
          if (isPending) ...[
            const SizedBox(height: 6),
            const Text(
              'Мы уведомим вас о результате проверки.',
              style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Payment block ────────────────────────────────────────────────────────────

class _PaymentBlock extends StatelessWidget {
  final String? bankName;
  final String? paymentPhone;
  final String userPhone;
  final VoidCallback onSaved;

  const _PaymentBlock({
    required this.bankName,
    required this.paymentPhone,
    required this.userPhone,
    required this.onSaved,
  });

  @override
  Widget build(BuildContext context) {
    final hasDetails = bankName != null && paymentPhone != null;
    return Container(
      padding: const EdgeInsets.all(14),
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
          Row(
            children: [
              const Icon(Icons.account_balance_outlined,
                  size: 16, color: Color(0xFF64748B)),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Платёжные реквизиты',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF475569),
                  ),
                ),
              ),
              TextButton(
                onPressed: () async {
                  final saved = await Navigator.push<bool>(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          PaymentFormScreen(initialPhone: userPhone),
                    ),
                  );
                  if (saved == true) onSaved();
                },
                style: TextButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Изменить',
                  style: TextStyle(fontSize: 13, color: Color(0xFF3B82F6)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (hasDetails) ...[
            Text(
              bankName!,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              formatPhone(paymentPhone),
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
          ] else
            const Text(
              'Не указаны',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFFCBD5E1),
                fontStyle: FontStyle.italic,
              ),
            ),
        ],
      ),
    );
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
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
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
        fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B),
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
            child: Text(label,
                style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
          ),
          Expanded(
            child: Text(
              value,
              style: valueStyle ??
                  const TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w500,
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
              fontSize: 11, fontWeight: FontWeight.w600,
              color: Color(0xFF94A3B8), letterSpacing: 0.5,
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
              _Stat(value: '$received', label: 'Принято', icon: Icons.assignment_outlined),
              _Stat(
                value: '$closed',
                label: 'Закрыто',
                icon: Icons.check_circle_outline,
                color: const Color(0xFF22C55E),
              ),
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
          Text(value,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: c)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
        ],
      ),
    );
  }
}
