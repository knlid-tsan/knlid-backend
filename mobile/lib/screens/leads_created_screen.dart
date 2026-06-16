import 'package:flutter/material.dart';
import '../models/lead.dart';
import '../services/leads_service.dart';
import 'lead_card.dart';
import 'lead_detail_screen.dart';

const _kActiveStatuses = {
  'new', 'pending_acceptance', 'in_progress',
  'contract', 'deposit', 'closed_success', 'dispute',
};

class LeadsCreatedScreen extends StatefulWidget {
  const LeadsCreatedScreen({super.key});

  @override
  State<LeadsCreatedScreen> createState() => _LeadsCreatedScreenState();
}

class _LeadsCreatedScreenState extends State<LeadsCreatedScreen> {
  final _service = LeadsService();
  List<Lead>? _leads;
  bool _loading = true;
  String? _error;
  bool _showDone = false;

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
      final leads = await _service.getMyCreated();
      setState(() => _leads = leads);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(24, 24, 24, 12),
              child: Text(
                'Переданные',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorState(message: _error!, onRetry: _load);
    }

    final allLeads = _leads ?? [];
    final filtered = allLeads
        .where((l) => _showDone
            ? !_kActiveStatuses.contains(l.status)
            : _kActiveStatuses.contains(l.status))
        .toList();

    return Column(
      children: [
        _FilterToggle(
          showDone: _showDone,
          onChanged: (v) => setState(() => _showDone = v),
        ),
        Expanded(
          child: filtered.isEmpty
              ? _EmptyState(
                  icon: Icons.send_outlined,
                  title: _showDone
                      ? 'Нет завершённых лидов'
                      : 'Нет активных лидов',
                  hint: _showDone
                      ? 'Завершённые лиды появятся здесь'
                      : 'Нажмите «Создать лид», чтобы передать первый',
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    itemBuilder: (ctx, i) => LeadCard(
                      lead: filtered[i],
                      showExecutor: true,
                      onTap: () async {
                        await Navigator.push(
                          ctx,
                          MaterialPageRoute(
                            builder: (_) =>
                                LeadDetailScreen(leadId: filtered[i].id),
                          ),
                        );
                        if (mounted) _load();
                      },
                    ),
                  ),
                ),
        ),
      ],
    );
  }
}

// ─── Filter toggle ────────────────────────────────────────────────────────────

class _FilterToggle extends StatelessWidget {
  final bool showDone;
  final ValueChanged<bool> onChanged;
  const _FilterToggle({required this.showDone, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Container(
        height: 36,
        decoration: BoxDecoration(
          color: const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            _Tab(
              label: 'Активные',
              selected: !showDone,
              onTap: () => onChanged(false),
            ),
            _Tab(
              label: 'Завершённые',
              selected: showDone,
              onTap: () => onChanged(true),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _Tab({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: selected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(7),
            boxShadow: selected
                ? const [
                    BoxShadow(
                      color: Color(0x18000000),
                      blurRadius: 4,
                      offset: Offset(0, 1),
                    )
                  ]
                : null,
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight:
                    selected ? FontWeight.w600 : FontWeight.w500,
                color: selected
                    ? const Color(0xFF1E293B)
                    : const Color(0xFF64748B),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String hint;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.hint,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: const Color(0xFFCBD5E1)),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              hint,
              style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Color(0xFFCBD5E1)),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Повторить'),
            ),
          ],
        ),
      ),
    );
  }
}
