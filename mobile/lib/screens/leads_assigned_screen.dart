import 'package:flutter/material.dart';
import '../models/lead.dart';
import '../services/leads_service.dart';
import 'lead_card.dart';
import 'lead_detail_screen.dart';

class LeadsAssignedScreen extends StatefulWidget {
  const LeadsAssignedScreen({super.key});

  @override
  State<LeadsAssignedScreen> createState() => _LeadsAssignedScreenState();
}

class _LeadsAssignedScreenState extends State<LeadsAssignedScreen> {
  final _service = LeadsService();
  List<Lead>? _leads;
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
      final leads = await _service.getMyAssigned();
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
                'Исполняю',
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

    final leads = _leads ?? [];

    if (leads.isEmpty) {
      return const _EmptyState(
        icon: Icons.assignment_outlined,
        title: 'Нет назначенных лидов',
        hint: 'Здесь появятся лиды, назначенные вам',
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: leads.length,
        itemBuilder: (ctx, i) => LeadCard(
          lead: leads[i],
          showExecutor: false,
          onTap: () async {
            await Navigator.push(
              ctx,
              MaterialPageRoute(
                builder: (_) => LeadDetailScreen(leadId: leads[i].id),
              ),
            );
            if (mounted) _load();
          },
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String hint;
  const _EmptyState({required this.icon, required this.title, required this.hint});

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
            Text(title,
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF64748B))),
            const SizedBox(height: 8),
            Text(hint,
                style:
                    const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                textAlign: TextAlign.center),
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
            Text(message,
                style:
                    const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                textAlign: TextAlign.center),
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
