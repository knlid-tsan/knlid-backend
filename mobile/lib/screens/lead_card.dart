import 'package:flutter/material.dart';
import '../models/lead.dart';

String _fmtAmount(String amount) {
  final n = double.tryParse(amount);
  if (n == null) return amount;
  return n
      .toStringAsFixed(0)
      .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
}

String _fmtDate(DateTime dt) =>
    '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}';

/// Card used in both LeadsCreatedScreen and LeadsAssignedScreen.
///
/// [showExecutor] true  → "Переданные" mode (author view, shows executor info).
/// [showExecutor] false → "Исполняю"   mode (executor view, shows client name after acceptance).
class LeadCard extends StatelessWidget {
  final Lead lead;
  final bool showExecutor;
  final VoidCallback onTap;

  const LeadCard({
    super.key,
    required this.lead,
    required this.showExecutor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = leadStatusColor(lead.status);
    final statusLabel = leadStatusLabels[lead.status] ?? lead.status;
    final typeLabel = leadTypeLabels[lead.type] ?? lead.type;

    // Client name is visible only when backend returned it (not null)
    final clientName = lead.client?.fullName;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: type label + status badge
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      typeLabel,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // City (always shown)
              _InfoLine(Icons.location_on_outlined, lead.city),
              const SizedBox(height: 4),

              // Date (always shown, DD.MM.YYYY)
              _InfoLine(Icons.calendar_today_outlined, _fmtDate(lead.createdAt)),

              // "Переданные" (author view) — show executor
              if (showExecutor) ...[
                const SizedBox(height: 4),
                _InfoLine(
                  Icons.person_outline,
                  lead.executorName ?? 'Исполнитель не назначен',
                  dim: lead.executorName == null,
                ),
              ],

              // "Исполняю" (executor view) — show client name after acceptance
              if (!showExecutor && clientName != null) ...[
                const SizedBox(height: 4),
                _InfoLine(Icons.person_outline, clientName),
              ],

              if (lead.rewardAmount != null) ...[
                const SizedBox(height: 4),
                _InfoLine(
                  Icons.monetization_on_outlined,
                  '${_fmtAmount(lead.rewardAmount!)} ₸',
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  final IconData icon;
  final String text;
  final bool dim;

  const _InfoLine(this.icon, this.text, {this.dim = false});

  @override
  Widget build(BuildContext context) {
    final color = dim ? const Color(0xFFCBD5E1) : const Color(0xFF64748B);
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: TextStyle(fontSize: 13, color: color),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
