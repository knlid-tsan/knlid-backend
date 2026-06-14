import 'package:flutter/material.dart';
import '../models/lead.dart';
import '../services/leads_service.dart';

String _fmt(String amount) {
  final n = double.tryParse(amount);
  if (n == null) return amount;
  return n
      .toStringAsFixed(0)
      .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
}

class LeadDetailScreen extends StatefulWidget {
  final String leadId;
  const LeadDetailScreen({super.key, required this.leadId});

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  final _service = LeadsService();
  Lead? _lead;
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
      final lead = await _service.getOne(widget.leadId);
      setState(() => _lead = lead);
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
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8FAFC),
        elevation: 0,
        leading: const BackButton(color: Color(0xFF1E293B)),
        title: Text(
          _lead != null
              ? (leadTypeLabels[_lead!.type] ?? _lead!.type)
              : 'Лид',
          style: const TextStyle(
            color: Color(0xFF1E293B),
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: _buildBody(),
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

    final lead = _lead!;
    final statusColor = leadStatusColor(lead.status);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Status banner
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
                  leadStatusLabels[lead.status] ?? lead.status,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Main info
          _Section(
            title: 'Основное',
            children: [
              _Row('Тип', leadTypeLabels[lead.type] ?? lead.type),
              _Row('Город', lead.city),
              _Row('Создан', formatLeadDate(lead.createdAt)),
              if (lead.closedAt != null)
                _Row('Закрыт', formatLeadDate(lead.closedAt!)),
            ],
          ),
          const SizedBox(height: 12),

          // Description
          _Section(
            title: 'Описание',
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  lead.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF1E293B),
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),

          // Client
          if (lead.client != null) ...[
            const SizedBox(height: 12),
            _Section(
              title: 'Клиент',
              children: [
                _Row('Имя', lead.client!.fullName),
                _Row('Город', lead.client!.city),
                if (lead.client!.phone != null)
                  _Row('Телефон', lead.client!.phone!),
              ],
            ),
          ],

          // Reward
          if (lead.rewardAmount != null) ...[
            const SizedBox(height: 12),
            _Section(
              title: 'Вознаграждение',
              children: [
                _Row('Сумма', '${_fmt(lead.rewardAmount!)} ₸'),
                _Row('Оплачено', lead.rewardPaid ? 'Да' : 'Нет'),
              ],
            ),
          ],

          // Guarantor
          if (lead.guarantor != null && lead.guarantor!.active) ...[
            const SizedBox(height: 12),
            _Section(
              title: 'Гарант',
              children: [
                _Row('Компания', lead.guarantor!.companyName),
              ],
            ),
          ],

          // History
          if (lead.history != null && lead.history!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _Section(
              title: 'История статусов',
              children: [
                ...lead.history!.map((h) => _HistoryRow(h)),
              ],
            ),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _Section({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF94A3B8),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;

  const _Row(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF1E293B),
                  fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  final StatusHistoryItem item;
  const _HistoryRow(this.item);

  @override
  Widget build(BuildContext context) {
    final fromLabel =
        item.fromStatus != null ? (leadStatusLabels[item.fromStatus] ?? item.fromStatus!) : '—';
    final toLabel = leadStatusLabels[item.toStatus] ?? item.toStatus;
    final toColor = leadStatusColor(item.toStatus);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 3),
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: toColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
                    children: [
                      TextSpan(text: fromLabel),
                      const TextSpan(
                          text: ' → ',
                          style: TextStyle(color: Color(0xFF94A3B8))),
                      TextSpan(
                          text: toLabel,
                          style: TextStyle(
                              color: toColor, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  formatLeadDate(item.createdAt),
                  style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
                if (item.comment != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    item.comment!,
                    style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                        fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
