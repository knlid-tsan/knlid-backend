import 'package:flutter/material.dart';
import '../models/tariff_entry.dart';
import '../services/tariffs_service.dart';
import '../theme/app_colors.dart';

const _leadTypeLabels = {
  'owner': 'Продажа',
  'buyer': 'Покупка',
  'mortgage': 'Ипотека',
  'legal': 'Юр. услуга',
};

const _leadTypeOrder = ['owner', 'buyer', 'mortgage', 'legal'];

class TariffsScreen extends StatefulWidget {
  const TariffsScreen({super.key});

  @override
  State<TariffsScreen> createState() => _TariffsScreenState();
}

class _TariffsScreenState extends State<TariffsScreen> {
  final _service = TariffsService();

  bool _loading = true;
  String? _error;

  List<TariffEntry> _tariffs = [];
  List<String> _cities = [];

  String? _selectedCity;
  String? _selectedType;

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
      final results = await Future.wait([
        _service.getTariffs(),
        _service.getCities(),
      ]);
      if (mounted) {
        setState(() {
          _tariffs = results[0] as List<TariffEntry>;
          _cities = results[1] as List<String>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _error = 'Не удалось загрузить тарифы';
        _loading = false;
      });
    }
  }

  TariffEntry? _resolve() {
    if (_selectedType == null) return null;
    // City-specific first
    if (_selectedCity != null) {
      final city = _tariffs.where(
        (t) => t.leadType == _selectedType && t.city == _selectedCity,
      );
      if (city.isNotEmpty) return city.first;
    }
    // Base tariff (city == null)
    final base = _tariffs.where(
      (t) => t.leadType == _selectedType && t.city == null,
    );
    if (base.isNotEmpty) return base.first;
    return null;
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
    final resolved = _resolve();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
      children: [
        const SizedBox(height: 24),
        const Text(
          'Тарифы',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 16),

        // ── Explanation ──────────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline, size: 18, color: AppColors.primary),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Вознаграждение начисляется только за лид, по которому состоялась сделка. '
                  'Если партнёр не закрыл договор — выплаты нет.',
                  style: TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.45),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // ── Calculator ───────────────────────────────────────────────────────
        Container(
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
                'КАЛЬКУЛЯТОР',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 16),

              // City dropdown
              const Text(
                'Город',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String?>(
                value: _selectedCity,
                decoration: _inputDec('Базовый тариф (любой город)'),
                items: [
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text(
                      'Базовый тариф',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                  ..._cities.map(
                    (c) => DropdownMenuItem<String?>(value: c, child: Text(c)),
                  ),
                ],
                onChanged: (v) => setState(() => _selectedCity = v),
              ),
              const SizedBox(height: 16),

              // Lead type dropdown
              const Text(
                'Тип лида',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: _inputDec('Выберите тип'),
                items: _leadTypeOrder
                    .map(
                      (k) => DropdownMenuItem(
                        value: k,
                        child: Text(_leadTypeLabels[k]!),
                      ),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _selectedType = v),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // ── Result ───────────────────────────────────────────────────────────
        if (_selectedType != null)
          _ResultCard(
            tariff: resolved,
            city: _selectedCity,
            leadType: _selectedType!,
          ),
      ],
    );
  }
}

InputDecoration _inputDec(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
      ),
      filled: true,
      fillColor: Colors.white,
    );

// ─── Result card ──────────────────────────────────────────────────────────────

class _ResultCard extends StatelessWidget {
  final TariffEntry? tariff;
  final String? city;
  final String leadType;

  const _ResultCard({
    required this.tariff,
    required this.city,
    required this.leadType,
  });

  @override
  Widget build(BuildContext context) {
    final typeLabel = _leadTypeLabels[leadType] ?? leadType;
    final cityLabel = city ?? 'базовый тариф';

    if (tariff == null) {
      return _card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _subtitle('$typeLabel · $cityLabel'),
            const SizedBox(height: 8),
            const Text(
              'Цена уточняется',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Обратитесь к администратору для уточнения условий.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    if (tariff!.method == 'fixed') {
      return _card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _subtitle('$typeLabel · $cityLabel'),
            const SizedBox(height: 8),
            Text(
              _fmtTenge(tariff!.value),
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'фиксированное вознаграждение за лид',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    // percent
    final pct = tariff!.value == tariff!.value.truncateToDouble()
        ? tariff!.value.toStringAsFixed(0)
        : tariff!.value.toStringAsFixed(1);
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _subtitle('$typeLabel · $cityLabel'),
          const SizedBox(height: 8),
          Text(
            '$pct%',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'от комиссии по сделке',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _subtitle(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w500,
        ),
      );

  Widget _card({required Widget child}) => Container(
        width: double.infinity,
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
        child: child,
      );
}

String _fmtTenge(double v) {
  final s = v.toStringAsFixed(0);
  final buf = StringBuffer();
  final len = s.length;
  for (int i = 0; i < len; i++) {
    if (i > 0 && (len - i) % 3 == 0) buf.write(' ');
    buf.write(s[i]);
  }
  return '${buf.toString()} ₸';
}
