import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/api_client.dart';
import '../services/leads_service.dart';
import '../services/phone_formatter.dart';
import '../models/lead.dart';
import '../theme/app_colors.dart';
import 'payment_form_screen.dart';

enum _Phase { typeAndPhone, checking, dupWarning, fullForm, submitting, success }

const _typeValues = {
  'owner': 'Продажа',
  'buyer': 'Покупка',
  'mortgage': 'Ипотека',
  'legal': 'Юр. услуга',
};

class CreateLeadScreen extends StatefulWidget {
  const CreateLeadScreen({super.key});

  @override
  State<CreateLeadScreen> createState() => _CreateLeadScreenState();
}

class _CreateLeadScreenState extends State<CreateLeadScreen> {
  final _service = LeadsService();
  final _client = ApiClient();

  _Phase _phase = _Phase.typeAndPhone;

  // Phase 1
  String? _type;
  final _phoneCtrl = TextEditingController();
  String? _lastCheckedPhone;
  String? _lastCheckedType;
  Map<String, dynamic>? _dupLead;

  // Phase 2
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  String? _selectedCity;
  final _descCtrl = TextEditingController();
  bool _force = false;

  // User data & cities (loaded on init)
  String? _userCity;
  String? _userPhone;
  bool _hasPayment = false;
  List<String> _cities = [];
  bool _initLoading = true;

  // Error messages
  String? _checkError;
  String? _submitError;

  bool _clientConsentAccepted = false;

  @override
  void initState() {
    super.initState();
    _phoneCtrl.addListener(_onPhoneChanged);
    _loadInit();
  }

  @override
  void dispose() {
    _phoneCtrl.removeListener(_onPhoneChanged);
    _phoneCtrl.dispose();
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadInit() async {
    try {
      final results = await Future.wait([
        _client.dio.get('/users/me'),
        _client.dio.get('/cities'),
      ]);
      final user = results[0].data as Map<String, dynamic>;
      final citiesRaw = results[1].data as List;
      final cities = citiesRaw
          .map((c) => (c as Map<String, dynamic>)['name'] as String)
          .toList()
        ..sort();

      if (mounted) {
        setState(() {
          _userCity = user['city'] as String?;
          _userPhone = user['phone'] as String?;
          _hasPayment = user['payment_bank_id'] != null &&
              (user['payment_phone'] as String?)?.isNotEmpty == true;
          _cities = cities;
          _selectedCity = null;
          _initLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _initLoading = false);
    }
  }

  // ─── Dup check logic ────────────────────────────────────────────────────────

  void _onPhoneChanged() => _handlePhase1Change();

  void _onTypeChanged(String? val) {
    setState(() => _type = val);
    _handlePhase1Change();
  }

  void _handlePhase1Change() {
    if (_phase == _Phase.fullForm || _phase == _Phase.dupWarning) {
      setState(() {
        _phase = _Phase.typeAndPhone;
        _force = false;
        _dupLead = null;
        _checkError = null;
        _submitError = null;
      });
    }
    _maybeCheck();
  }

  void _maybeCheck() {
    final digits = _phoneCtrl.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 11 || _type == null) return;
    final phone = stripPhone(_phoneCtrl.text);
    if (phone == _lastCheckedPhone && _type == _lastCheckedType) return;
    _lastCheckedPhone = phone;
    _lastCheckedType = _type;
    _doCheck(phone, _type!);
  }

  Future<void> _doCheck(String phone, String type) async {
    setState(() {
      _phase = _Phase.checking;
      _checkError = null;
    });
    try {
      final result = await _service.checkDuplicate(type, phone);
      if (!mounted) return;
      final isDup = result['duplicate'] as bool? ?? false;
      setState(() {
        if (isDup) {
          _phase = _Phase.dupWarning;
          _dupLead = result['lead'] as Map<String, dynamic>?;
        } else {
          _phase = _Phase.fullForm;
        }
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _phase = _Phase.typeAndPhone;
          _checkError = 'Ошибка проверки. Повторите.';
        });
      }
    }
  }

  void _onForceCreate() {
    setState(() {
      _force = true;
      _phase = _Phase.fullForm;
      _dupLead = null;
    });
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    if (!_hasPayment) {
      final saved = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => PaymentFormScreen(initialPhone: _userPhone ?? ''),
        ),
      );
      if (saved != true || !mounted) return;
      setState(() => _hasPayment = true);
    }
    await _doCreate();
  }

  Future<void> _doCreate() async {
    setState(() {
      _phase = _Phase.submitting;
      _submitError = null;
    });
    try {
      await _service.createLead(
        type: _type!,
        city: _selectedCity!,
        description: _descCtrl.text.trim(),
        clientPhone: stripPhone(_phoneCtrl.text),
        clientName: _nameCtrl.text.trim(),
        clientCity: _selectedCity!,
        force: _force,
      );
      if (mounted) setState(() => _phase = _Phase.success);
    } on DioException catch (e) {
      if (!mounted) return;
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      final msgStr = msg is String ? msg : 'Ошибка создания лида';

      if (e.response?.statusCode == 403 &&
          msgStr.toLowerCase().contains('реквизит')) {
        final saved = await Navigator.push<bool>(
          context,
          MaterialPageRoute(
            builder: (_) => PaymentFormScreen(initialPhone: _userPhone ?? ''),
          ),
        );
        if (saved == true && mounted) {
          setState(() => _hasPayment = true);
          await _doCreate();
        } else if (mounted) {
          setState(() => _phase = _Phase.fullForm);
        }
      } else if (e.response?.statusCode == 409) {
        final existing = data is Map
            ? data['existingLead'] as Map<String, dynamic>?
            : null;
        setState(() {
          _phase = _Phase.dupWarning;
          _dupLead = existing;
        });
      } else {
        setState(() {
          _phase = _Phase.fullForm;
          _submitError = msgStr;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _phase = _Phase.fullForm;
          _submitError = 'Ошибка создания лида';
        });
      }
    }
  }

  // ─── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: const Text(
          'Новый лид',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: _initLoading
          ? const Center(child: CircularProgressIndicator())
          : _phase == _Phase.success
              ? _buildSuccess()
              : _buildForm(),
    );
  }

  Widget _buildForm() {
    final isSubmitting = _phase == _Phase.submitting;

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: [
          // ── ФАЗА 1: Тип + Телефон ─────────────────────────────────────────

          _Label('Тип лида'),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: _type,
            decoration: _inputDec(hint: 'Выберите тип'),
            items: _typeValues.entries
                .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                .toList(),
            onChanged: isSubmitting ? null : _onTypeChanged,
            validator: (v) => v == null ? 'Выберите тип лида' : null,
          ),
          const SizedBox(height: 16),

          _Label('Телефон клиента'),
          const SizedBox(height: 6),
          TextFormField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            inputFormatters: [PhoneMaskFormatter()],
            enabled: !isSubmitting,
            decoration: _inputDec(hint: '+7 XXX XXX XX XX'),
            validator: (v) {
              final d = v?.replaceAll(RegExp(r'\D'), '') ?? '';
              if (d.length != 11) return 'Введите полный номер телефона';
              return null;
            },
          ),

          // ── Индикатор проверки ─────────────────────────────────────────────
          if (_phase == _Phase.checking) ...[
            const SizedBox(height: 16),
            const Row(
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                SizedBox(width: 10),
                Text(
                  'Проверяем дубли...',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
              ],
            ),
          ],

          // ── Ошибка проверки ────────────────────────────────────────────────
          if (_checkError != null) ...[
            const SizedBox(height: 12),
            _ErrorCard(_checkError!),
          ],

          // ── Предупреждение о дубле ─────────────────────────────────────────
          if (_phase == _Phase.dupWarning) ...[
            const SizedBox(height: 16),
            _DupWarning(
              dupLead: _dupLead,
              onCancel: () => setState(() {
                _phase = _Phase.typeAndPhone;
                _lastCheckedPhone = null;
                _lastCheckedType = null;
              }),
              onForce: _onForceCreate,
            ),
          ],

          // ── ФАЗА 2: Имя + Город + Описание ────────────────────────────────
          if (_phase == _Phase.fullForm ||
              _phase == _Phase.submitting) ...[
            const SizedBox(height: 20),
            const Divider(color: AppColors.divider),
            const SizedBox(height: 20),

            _Label('Имя клиента'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _nameCtrl,
              textCapitalization: TextCapitalization.words,
              enabled: !isSubmitting,
              decoration: _inputDec(hint: 'Нурлан Серіков'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Введите имя клиента' : null,
            ),
            const SizedBox(height: 16),

            _Label('Город, где нужна услуга'),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              value: _selectedCity,
              decoration: _inputDec(hint: 'Выберите город'),
              items: _cities
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: isSubmitting
                  ? null
                  : (v) => setState(() => _selectedCity = v),
              validator: (v) => v == null ? 'Выберите город' : null,
            ),
            const SizedBox(height: 4),
            const Text(
              'Где находится объект или нужна услуга — по этому городу подбирается местный специалист',
              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),

            _Label('Описание / суть запроса'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _descCtrl,
              maxLines: 5,
              minLines: 3,
              enabled: !isSubmitting,
              textCapitalization: TextCapitalization.sentences,
              decoration: _inputDec(
                hint: 'Опишите задачу клиента подробно: что именно нужно, условия, пожелания…',
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Добавьте описание' : null,
            ),

            if (_submitError != null) ...[
              const SizedBox(height: 12),
              _ErrorCard(_submitError!),
            ],

            const SizedBox(height: 20),
            _ConsentCheckbox(
              value: _clientConsentAccepted,
              onChanged: (v) =>
                  setState(() => _clientConsentAccepted = v ?? false),
              text: 'Я подтверждаю, что получил согласие клиента на передачу '
                  'его контактных данных',
            ),

            const SizedBox(height: 16),
            FilledButton(
              onPressed: isSubmitting || !_clientConsentAccepted ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text(
                      'Создать лид',
                      style: TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w600),
                    ),
            ),

            if (!_hasPayment) ...[
              const SizedBox(height: 12),
              const Text(
                'Перед созданием потребуется указать платёжные реквизиты.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildSuccess() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 36),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: const BoxDecoration(
                color: Color(0xFFF0FDF4),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_outline,
                size: 44,
                color: AppColors.success,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Лид создан!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Спасибо! Мы подберём исполнителя и уведомим вас.',
              style: TextStyle(
                fontSize: 15,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 36),
            FilledButton(
              onPressed: () => Navigator.pop(context),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(
                    horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text(
                'Посмотреть лиды',
                style:
                    TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDec({required String hint}) => InputDecoration(
        filled: true,
        fillColor: Colors.white,
        hintText: hint,
        hintStyle:
            const TextStyle(fontSize: 14, color: AppColors.divider),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.brand),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: AppColors.brand, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      );
}

// ─── Helper widgets ───────────────────────────────────────────────────────────

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: AppColors.textSecondary,
        ),
      );
}

class _ErrorCard extends StatelessWidget {
  final String message;
  const _ErrorCard(this.message);

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          border: Border.all(color: const Color(0xFFFECACA)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          message,
          style: const TextStyle(fontSize: 13, color: AppColors.brand),
        ),
      );
}

class _DupWarning extends StatelessWidget {
  final Map<String, dynamic>? dupLead;
  final VoidCallback onCancel;
  final VoidCallback onForce;

  const _DupWarning({
    required this.dupLead,
    required this.onCancel,
    required this.onForce,
  });

  @override
  Widget build(BuildContext context) {
    final type = dupLead != null
        ? (leadTypeLabels[dupLead!['type']] ?? dupLead!['type'] as String)
        : 'неизвестного типа';
    final status = dupLead != null
        ? (leadStatusLabels[dupLead!['status']] ?? dupLead!['status'] as String)
        : '';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        border: Border.all(color: const Color(0xFFFCD34D)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_amber_outlined,
                  size: 16, color: Color(0xFF92400E)),
              SizedBox(width: 8),
              Text(
                'Возможный дубль',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF92400E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'На этот номер уже есть активный лид типа «$type»'
            '${status.isNotEmpty ? " ($status)" : ""}.',
            style: const TextStyle(fontSize: 13, color: Color(0xFF78350F)),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onCancel,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFCD34D)),
                    foregroundColor: const Color(0xFF92400E),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Отмена',
                      style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton(
                  onPressed: onForce,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF92400E),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Создать всё равно',
                      style: TextStyle(fontSize: 13)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ConsentCheckbox extends StatelessWidget {
  final bool value;
  final ValueChanged<bool?> onChanged;
  final String text;
  const _ConsentCheckbox({
    required this.value,
    required this.onChanged,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: GestureDetector(
            onTap: () => onChanged(!value),
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
