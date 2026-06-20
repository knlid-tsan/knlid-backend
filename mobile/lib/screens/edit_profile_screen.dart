import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../l10n/app_localizations.dart';
import '../l10n/lead_labels.dart';
import '../models/city.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';

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
      if (mounted) {
        setState(() => _error = AppLocalizations.of(context)!.citiesLoadError);
      }
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
      if (mounted) {
        setState(() => _error = msg is String ? msg : AppLocalizations.of(context)!.saveError);
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = AppLocalizations.of(context)!.saveError);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final specializations = [
      {'value': 'realtor', 'label': l.specRealtor},
      {'value': 'mortgage', 'label': l.specMortgage},
      {'value': 'lawyer', 'label': l.specLawyer},
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: Text(
          l.editProfileTitle,
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
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

                if (_isVerified && _hasActiveLead) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFED7AA)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline, size: 18, color: Color(0xFFF97316)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            l.editProfileLocked,
                            style: const TextStyle(fontSize: 13, color: Color(0xFF9A3412), height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                _Label(l.labelFullName),
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
                    if (v == null || v.trim().isEmpty) return l.fullNameRequired;
                    if (v.trim().split(' ').length < 2) return l.fullNameRequired;
                    return null;
                  },
                ),
                if (_isVerified) ...[
                  const SizedBox(height: 6),
                  Text(
                    l.nameLockedHint,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
                const SizedBox(height: 20),

                _Label(l.labelSpecialization),
                const SizedBox(height: 8),
                if (_hasActiveLead) ...[
                  _LockedField(
                    value: specializationLabel(l, _specialization ?? ''),
                  ),
                  const SizedBox(height: 6),
                  _LockedHint(text: l.lockedLeadsHint),
                ] else
                  ...(specializations.map((s) => _SpecOption(
                        label: s['label']!,
                        value: s['value']!,
                        selected: _specialization == s['value'],
                        onTap: () => setState(() => _specialization = s['value']),
                      ))),
                const SizedBox(height: 20),

                _Label(l.labelCity),
                const SizedBox(height: 8),
                if (_hasActiveLead) ...[
                  _LockedField(value: widget.user['city'] as String? ?? '—'),
                  const SizedBox(height: 6),
                  _LockedHint(text: l.lockedLeadsHint),
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
                    hint: Text(l.cityPickerHint),
                    decoration: _inputDecoration(null),
                    items: _cities
                        .map((c) => DropdownMenuItem(value: c, child: Text(c.name)))
                        .toList(),
                    onChanged: (v) => setState(() => _city = v),
                    validator: (v) => v == null ? l.cityRequired : null,
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
                      : Text(
                          l.btnSave,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
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
  final String text;
  const _LockedHint({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
    );
  }
}
