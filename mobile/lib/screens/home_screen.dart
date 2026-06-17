import 'package:flutter/material.dart';
import '../models/lead.dart';
import '../services/leads_service.dart';
import '../services/api_client.dart';
import '../services/support_service.dart';
import '../services/notifications_service.dart';
import '../theme/app_colors.dart';
import 'lead_card.dart';
import 'lead_detail_screen.dart';
import 'create_lead_screen.dart';
import 'support_chat_screen.dart';
import 'notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback? onLeadCreated;
  const HomeScreen({super.key, this.onLeadCreated});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _service = LeadsService();

  bool _loading = true;
  String? _error;
  int _unreadCount = 0;
  int _unreadNotifCount = 0;

  Lead? _topCreated;
  Lead? _topAssigned;
  Map<String, dynamic>? _stats;

  @override
  void initState() {
    super.initState();
    _load();
    _loadUnread();
    _loadNotifBadge();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      late List<Lead> created;
      late List<Lead> assigned;
      late Map<String, dynamic> me;

      await Future.wait([
        _service.getMyCreated().then((v) => created = v),
        _service.getMyAssigned().then((v) => assigned = v),
        ApiClient()
            .dio
            .get('/users/me')
            .then((r) => me = r.data as Map<String, dynamic>),
      ]);

      created.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
      assigned.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

      // Priority for assigned: pending_acceptance first, else most recently updated
      final pending =
          assigned.where((l) => l.status == 'pending_acceptance').toList();
      final topAssigned =
          pending.isNotEmpty ? pending.first : (assigned.isEmpty ? null : assigned.first);

      if (mounted) {
        setState(() {
          _topCreated = created.isEmpty ? null : created.first;
          _topAssigned = topAssigned;
          _stats = me;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _openLead(Lead lead) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: lead.id)),
    );
    if (mounted) _load();
  }

  Future<void> _loadUnread() async {
    try {
      final count = await SupportService().getUnread();
      if (mounted) setState(() => _unreadCount = count);
    } catch (_) {}
  }

  Future<void> _loadNotifBadge() async {
    try {
      final count = await NotificationsService().getUnreadCount();
      if (mounted) setState(() => _unreadNotifCount = count);
    } catch (_) {}
  }

  Future<void> _openNotifications() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
    );
    if (!mounted) return;
    // Give fire-and-forget markRead calls time to complete on server
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) _loadNotifBadge();
  }

  Future<void> _openChat() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SupportChatScreen()),
    );
    if (mounted) _loadUnread();
  }

  Future<void> _openCreate() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CreateLeadScreen()),
    );
    if (mounted) {
      _load();
      widget.onLeadCreated?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildError()
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _buildContent(),
                  ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.divider),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
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

  Widget _buildContent() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(0, 24, 0, 20),
          child: Stack(
            alignment: Alignment.center,
            children: [
              const _CompactLogo(),
              Positioned(
                right: 0,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _BellButton(
                      count: _unreadNotifCount,
                      onTap: _openNotifications,
                    ),
                    const SizedBox(width: 10),
                    _ChatButton(count: _unreadCount, onTap: _openChat),
                  ],
                ),
              ),
            ],
          ),
        ),

        // ── Block: Переданные ──────────────────────────────────────────────
        const _SectionHeader('Переданные'),
        if (_topCreated != null)
          LeadCard(
            lead: _topCreated!,
            showExecutor: true,
            onTap: () => _openLead(_topCreated!),
          )
        else
          const _EmptyBlock(
            icon: Icons.send_outlined,
            text: 'Вы ещё не передавали лиды',
          ),
        const SizedBox(height: 4),

        // ── Block: Исполняю ────────────────────────────────────────────────
        const _SectionHeader('Исполняю'),
        if (_topAssigned != null)
          LeadCard(
            lead: _topAssigned!,
            showExecutor: false,
            onTap: () => _openLead(_topAssigned!),
          )
        else
          const _EmptyBlock(
            icon: Icons.assignment_outlined,
            text: 'У вас нет лидов в работе',
          ),
        const SizedBox(height: 20),

        // ── Create lead button ─────────────────────────────────────────────
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton.icon(
            onPressed: _openCreate,
            icon: const Icon(Icons.add, size: 20),
            label: const Text(
              'Создать лид',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // ── Stats block ────────────────────────────────────────────────────
        if (_stats != null) _buildStats(),
      ],
    );
  }

  Widget _buildStats() {
    final rawRating = _stats!['rating'];
    final rating = (rawRating is num ? rawRating.toDouble() : double.tryParse('$rawRating') ?? 0.0);
    final sent = _stats!['leads_sent'] as int? ?? 0;
    final received = _stats!['leads_received'] as int? ?? 0;
    final closed = _stats!['leads_closed'] as int? ?? 0;

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
            'СТАТИСТИКА',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _StatCell(
                value: rating.toStringAsFixed(1),
                label: 'Рейтинг',
                icon: Icons.star_outline,
                color: const Color(0xFFF59E0B),
              ),
              _StatCell(
                value: '$sent',
                label: 'Передано',
                icon: Icons.send_outlined,
                color: AppColors.primary,
              ),
              _StatCell(
                value: '$received',
                label: 'Принято',
                icon: Icons.assignment_outlined,
                color: AppColors.primary,
              ),
              _StatCell(
                value: '$closed',
                label: 'Закрыто',
                icon: Icons.check_circle_outline,
                color: AppColors.success,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Private widgets ──────────────────────────────────────────────────────────

class _CompactLogo extends StatelessWidget {
  const _CompactLogo();

  static const _red = AppColors.brand;
  static const _style = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: _red,
    height: 1,
    letterSpacing: -1,
  );

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Text('kn', style: _style),
        const SizedBox(width: 2),
        Container(
          width: 10,
          height: 10,
          decoration: const BoxDecoration(color: _red, shape: BoxShape.circle),
          child: const Icon(Icons.home, size: 6, color: Colors.white),
        ),
        const SizedBox(width: 2),
        const Text('lid', style: _style),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  const _SectionHeader(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _EmptyBlock extends StatelessWidget {
  final IconData icon;
  final String text;
  const _EmptyBlock({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.divider),
          const SizedBox(width: 10),
          Text(
            text,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _BellButton extends StatelessWidget {
  final int count;
  final VoidCallback onTap;
  const _BellButton({required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.notifications_outlined,
                size: 26, color: AppColors.textPrimary),
            if (count > 0)
              Positioned(
                top: -4,
                right: -4,
                child: Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                    color: AppColors.brand,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      count > 9 ? '9+' : '$count',
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ChatButton extends StatelessWidget {
  final int count;
  final VoidCallback onTap;
  const _ChatButton({required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.chat_bubble_outline,
                size: 26, color: AppColors.textPrimary),
            if (count > 0)
              Positioned(
                top: -4,
                right: -4,
                child: Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                    color: AppColors.brand,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      count > 9 ? '9+' : '$count',
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color? color;
  const _StatCell({
    required this.value,
    required this.label,
    required this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.textSecondary;
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 20, color: c),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: c,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
