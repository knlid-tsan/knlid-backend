import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/city.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';

class RegisterScreen extends StatefulWidget {
  final String phone;
  final String code;

  const RegisterScreen({super.key, required this.phone, required this.code});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();
  final _client = ApiClient();

  String? _specialization;
  City? _city;
  List<City> _cities = [];

  bool _loadingCities = true;
  bool _submitting = false;
  bool _termsAccepted = false;
  String _error = '';

  static const _specializations = [
    {'value': 'realtor', 'label': 'Риелтор'},
    {'value': 'mortgage', 'label': 'Ипотечный брокер'},
    {'value': 'lawyer', 'label': 'Юрист'},
  ];

  @override
  void initState() {
    super.initState();
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
      if (mounted) setState(() => _cities = cities);
    } catch (e) {
      if (mounted) setState(() => _error = 'Не удалось загрузить города: $e');
    } finally {
      if (mounted) setState(() => _loadingCities = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_specialization == null) {
      setState(() => _error = 'Выберите специализацию');
      return;
    }
    if (_city == null) {
      setState(() => _error = 'Выберите город');
      return;
    }

    setState(() {
      _submitting = true;
      _error = '';
    });

    try {
      final token = await _authService.register(
        phone: widget.phone,
        code: widget.code,
        fullName: _nameController.text.trim(),
        specialization: _specialization!,
        city: _city!.name,
      );
      await _client.saveToken(token);
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(context, '/home', (r) => false);
    } catch (e) {
      setState(() => _error = e.toString());
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
          'Регистрация',
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
                const Text(
                  'Расскажите о себе',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Номер ${widget.phone} не зарегистрирован. Заполните профиль.',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 28),

                // Имя и фамилия
                _Label('Имя и фамилия'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  decoration: _inputDecoration('Нурлан Серіков'),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Введите имя и фамилию';
                    if (v.trim().split(' ').length < 2) return 'Введите имя и фамилию';
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // Специализация
                _Label('Специализация'),
                const SizedBox(height: 8),
                ...(_specializations.map((s) => _SpecOption(
                      label: s['label']!,
                      value: s['value']!,
                      selected: _specialization == s['value'],
                      onTap: () => setState(() => _specialization = s['value']),
                    ))),
                const SizedBox(height: 20),

                // Город
                _Label('Город'),
                const SizedBox(height: 8),
                if (_loadingCities)
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

                const SizedBox(height: 24),
                _TermsConsentRow(
                  accepted: _termsAccepted,
                  onChanged: (v) => setState(() => _termsAccepted = v ?? false),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _submitting || !_termsAccepted ? null : _submit,
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
                          'Зарегистрироваться',
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

  InputDecoration _inputDecoration(String? hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: AppColors.surface,
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide.none,
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          borderSide: BorderSide(color: AppColors.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      );
}

class _TermsConsentRow extends StatelessWidget {
  final bool accepted;
  final ValueChanged<bool?> onChanged;
  const _TermsConsentRow({required this.accepted, required this.onChanged});

  Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: accepted,
            onChanged: onChanged,
            activeColor: AppColors.primary,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: GestureDetector(
            onTap: () => onChanged(!accepted),
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.45,
                ),
                children: [
                  const TextSpan(text: 'Я принимаю '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: GestureDetector(
                      onTap: () => _open('https://lid.kn.kz/terms'),
                      child: const Text(
                        'Пользовательское соглашение',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.primary,
                          decoration: TextDecoration.underline,
                          decorationColor: AppColors.primary,
                          height: 1.45,
                        ),
                      ),
                    ),
                  ),
                  const TextSpan(text: ' и '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: GestureDetector(
                      onTap: () => _open('https://lid.kn.kz/privacy'),
                      child: const Text(
                        'Политику конфиденциальности',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.primary,
                          decoration: TextDecoration.underline,
                          decorationColor: AppColors.primary,
                          height: 1.45,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

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
