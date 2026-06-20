import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../models/app_notification.dart';
import '../services/notifications_service.dart';
import '../theme/app_colors.dart';
import 'lead_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _service = NotificationsService();
  List<AppNotification> _items = [];
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
      final items = await _service.getMyNotifications();
      // Mark all as read on server (fire-and-forget)
      _service.markAllRead().catchError((_) {});
      // Reflect as read locally so UI shows them as read immediately
      for (final item in items) {
        item.isRead = true;
      }
      if (mounted) setState(() {
        _items = items;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _onTap(AppNotification notif) async {
    // Mark as read locally immediately
    if (!notif.isRead) {
      setState(() => notif.isRead = true);
      _service.markRead(notif.id).catchError((_) {});
    }

    // Navigate to lead if notification carries a lead_id
    final leadId = notif.leadId;
    if (leadId != null && mounted) {
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: leadId)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          l.notificationsTitle,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.divider),
        ),
      ),
      body: _buildBody(l),
    );
  }

  Widget _buildBody(AppLocalizations l) {
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
              const Icon(Icons.error_outline, size: 40, color: AppColors.divider),
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              OutlinedButton(onPressed: _load, child: Text(l.btnRetry)),
            ],
          ),
        ),
      );
    }
    if (_items.isEmpty) {
      return Center(
        child: Text(
          l.noNotifications,
          style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        itemCount: _items.length,
        separatorBuilder: (_, _i) =>
            const Divider(height: 1, color: AppColors.divider),
        itemBuilder: (_, i) => _NotifTile(
          notif: _items[i],
          onTap: () => _onTap(_items[i]),
        ),
      ),
    );
  }
}

class _NotifTile extends StatefulWidget {
  final AppNotification notif;
  final VoidCallback onTap;
  const _NotifTile({required this.notif, required this.onTap});

  @override
  State<_NotifTile> createState() => _NotifTileState();
}

class _NotifTileState extends State<_NotifTile> {
  @override
  Widget build(BuildContext context) {
    final isRead = widget.notif.isRead;
    return InkWell(
      onTap: () {
        widget.onTap();
        setState(() {}); // reflect isRead change
      },
      child: Container(
        color: isRead ? AppColors.surface : AppColors.primary.withValues(alpha: 0.04),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Unread dot
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(top: 5, right: 10),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isRead ? Colors.transparent : AppColors.primary,
              ),
            ),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.notif.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isRead ? FontWeight.w500 : FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    widget.notif.body,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _relativeTime(widget.notif.createdAt),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            // Chevron if leads somewhere
            if (widget.notif.leadId != null)
              const Padding(
                padding: EdgeInsets.only(left: 4, top: 2),
                child: Icon(
                  Icons.chevron_right,
                  size: 18,
                  color: AppColors.textSecondary,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _relativeTime(DateTime dt) {
    final l = AppLocalizations.of(context)!;
    final now = DateTime.now();
    final diff = now.difference(dt.toLocal());
    if (diff.inMinutes < 1) return l.relTimeJustNow;
    if (diff.inMinutes < 60) return l.relTimeMinutes(diff.inMinutes);
    if (diff.inHours < 24) return l.relTimeHours(diff.inHours);
    if (diff.inDays < 2) return l.relTimeYesterday;
    if (diff.inDays < 7) return l.relTimeDays(diff.inDays);
    final months = [
      l.monthJan, l.monthFeb, l.monthMar, l.monthApr,
      l.monthMay, l.monthJun, l.monthJul, l.monthAug,
      l.monthSep, l.monthOct, l.monthNov, l.monthDec,
    ];
    final local = dt.toLocal();
    return '${local.day} ${months[local.month - 1]}';
  }
}
