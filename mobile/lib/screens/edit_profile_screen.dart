import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/city.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';

const _specializationLabels = {
  'realtor': 'Риелтор',
  'mortgage': 'Ипотечный брокер',
  'lawyer': 'Юрист',
};

const _specializations = [
  {'value': 'realtor', 'label': 'Риелтор'},
  {'value': 'mortgage', 'label': 'Ипотечный брокер'},
  {'value': 'lawyer', 'label': 'Юрист'},
];

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const EditProfileScreen({super.key, required this.user});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _client = ApiClient();
  final _authService = AuthService();

  String? _specialization;
  City? _city;
  List<City> _cities = [];

  bool _loadingCities = true;
  bool _submitting = false;
  String _error = '';

  bool get _isVerified => widget.user['status'] == 'active';
  bool get _hasActiveLead => widget.user['has_active_execution_leads'] == true;

  @override
  void initState() {
    super.initState();
    _nameController.text = widget.user['full_name'] as String? ?? '';
    _specialization = widget.user['specialization'] as String?;
    _loadCities();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadCities() async {
    try {
      final cities = await _authService.getCities();
      if (mounted) {
        final currentCity = widget.user['city'] as String?;
        final match = currentCity != null
            ? cities.where((c) => c.name == currentCity).firstOrNull
            : null;
        setState(() {
          _cities = cities;
          _city = match;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _error = 'Не удалось загрузить список городов');
    } finally {
      if (mounted) setState(() => _loadingCities = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final body = <String, dynamic>{};
    if (!_isVerified) {
      body['full_name'] = _nameController.text.trim();
    }
    if (!_hasActiveLead) {
      if (_specialization != null) body['specialization'] = _specialization;
      if (_city != null) body['city'] = _city!.name;
    }

    if (body.isEmpty) {
      if (mounted) Navigator.pop(context, false);
      return;
    }

    setState(() { _submitting = true; _error = ''; });
    try {
      await _client.dio.patch('/users/me/profile', data: body);
      if (mounted) Navigator.pop(context, true);
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      setState(() => _error = msg is String ? msg : 'Ошибка сохранения');
    } catch (_) {
      setState(() => _error = 'Ошибка сохранения');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: const Text(
          'Редактировать профиль',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 12),

                // ── Пояснение когда всё заблокировано ──
                if (_isVerified && _hasActiveLead) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFED7AA)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.info_outline, size: 18, color: Color(0xFFF97316)),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Сейчас профиль изменить нельзя. Имя и фамилия заморожены после верификации. Специализацию и город нельзя менять, пока у вас есть лиды в работе.',
                            style: TextStyle(fontSize: 13, color: Color(0xFF9A3412), height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // ── Имя и фамилия ──
                const _Label('Имя и фамилия'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nameController,
                  enabled: !_isVerified,
                  textCapitalization: TextCapitalization.words,
                  decoration: _inputDecoration(
                    'Нурлан Серіков',
                    disabled: _isVerified,
                  ),
                  validator: (v) {
                    if (_isVerified) return null;
                    if (v == null || v.trim().isEmpty) return 'Введите имя и фамилию';
                    if (v.trim().split(' ').length < 2) return 'Введите имя и фамилию';
                    return null;
                  },
                ),
                if (_isVerified) ...[
                  const SizedBox(height: 6),
                  const Text(
                    'Имя и фамилию нельзя изменить после верификации',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
                const SizedBox(height: 20),

                // ── Специализация ──
                const _Label('Специализация'),
                const SizedBox(height: 8),
                if (_hasActiveLead) ...[
                  _LockedField(
                    value: _specializationLabels[_specialization] ?? _specialization ?? '—',
                  ),
                  const SizedBox(height: 6),
                  const _LockedHint(),
                ] else
                  ...(_specializations.map((s) => _SpecOption(
                        label: s['label']!,
                        value: s['value']!,
                        selected: _specialization == s['value'],
                        onTap: () => setState(() => _specialization = s['value']),
                      ))),
                const SizedBox(height: 20),

                // ── Город ──
                const _Label('Город'),
                const SizedBox(height: 8),
                if (_hasActiveLead) ...[
                  _LockedField(value: widget.user['city'] as String? ?? '—'),
                  const SizedBox(height: 6),
                  const _LockedHint(),
                ] else if (_loadingCities)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                else
                  DropdownButtonFormField<City>(
                    value: _city,
                    hint: const Text('Выберите город'),
                    decoration: _inputDecoration(null),
                    items: _cities
                        .map((c) => DropdownMenuItem(value: c, child: Text(c.name)))
                        .toList(),
                    onChanged: (v) => setState(() => _city = v),
                    validator: (v) => v == null ? 'Выберите город' : null,
                  ),

                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      _error,
                      style: const TextStyle(color: AppColors.brand, fontSize: 13),
                    ),
                  ),
                ],

                const SizedBox(height: 28),
                FilledButton(
                  onPressed: (_submitting || (!_hasActiveLead && _loadingCities))
                      ? null
                      : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Сохранить',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String? hint, {bool disabled = false}) =>
      InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: disabled ? AppColors.divider : AppColors.surface,
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide.none,
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(color: AppColors.primary, width: 1.5),
        ),
        disabledBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide.none,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      );
}

// ─── Shared widgets ───────────────────────────────────────────────────────────

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppColors.textSecondary,
        ),
      );
}

class _SpecOption extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  const _SpecOption({
    required this.label,
    required this.value,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.divider,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              size: 18,
              color: selected ? Colors.white : AppColors.textSecondary,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: selected ? Colors.white : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LockedField extends StatelessWidget {
  final String value;
  const _LockedField({required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.divider,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_outline, size: 16, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Text(
            value,
            style: const TextStyle(fontSize: 15, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _LockedHint extends StatelessWidget {
  const _LockedHint();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'Недоступно: у вас есть лиды в работе',
      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
    );
  }
}
