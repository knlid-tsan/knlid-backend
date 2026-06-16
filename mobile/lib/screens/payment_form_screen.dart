import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/api_client.dart';
import '../services/phone_formatter.dart';
import '../theme/app_colors.dart';

class PaymentFormScreen extends StatefulWidget {
  final String initialPhone;
  const PaymentFormScreen({super.key, required this.initialPhone});

  @override
  State<PaymentFormScreen> createState() => _PaymentFormScreenState();
}

class _PaymentFormScreenState extends State<PaymentFormScreen> {
  final _client = ApiClient();
  final _formKey = GlobalKey<FormState>();
  final _phoneCtrl = TextEditingController();

  List<Map<String, dynamic>> _banks = [];
  String? _selectedBankId;
  bool _loadingBanks = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _phoneCtrl.text = formatPhone(widget.initialPhone);
    _loadBanks();
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadBanks() async {
    try {
      final res = await _client.dio.get('/banks');
      setState(() {
        _banks = (res.data as List).cast<Map<String, dynamic>>();
        _loadingBanks = false;
      });
    } catch (_) {
      setState(() {
        _error = 'Не удалось загрузить список банков';
        _loadingBanks = false;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      await _client.dio.patch('/users/me/payment', data: {
        'bank_id': _selectedBankId,
        'payment_phone': stripPhone(_phoneCtrl.text),
      });
      if (mounted) Navigator.pop(context, true);
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      setState(() => _error = msg is String ? msg : 'Ошибка сохранения');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Платёжные реквизиты',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.white,
      ),
      body: _loadingBanks
          ? const Center(child: CircularProgressIndicator())
          : _buildForm(),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              border: Border.all(color: AppColors.divider),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline, size: 16, color: AppColors.primary),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Укажите реквизиты, на которые вы получаете вознаграждение за переданные лиды.',
                    style: TextStyle(fontSize: 13, color: AppColors.primary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const Text(
            'Банк',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedBankId,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
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
                borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.brand),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              hintText: 'Выберите банк',
            ),
            items: _banks
                .map((b) => DropdownMenuItem<String>(
                      value: b['id'] as String,
                      child: Text(b['name'] as String),
                    ))
                .toList(),
            onChanged: (v) => setState(() => _selectedBankId = v),
            validator: (v) => v == null ? 'Выберите банк' : null,
          ),
          const SizedBox(height: 20),

          const Text(
            'Номер для перевода',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            inputFormatters: [PhoneMaskFormatter()],
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
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
                borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.brand),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              hintText: '+7 XXX XXX XX XX',
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Введите номер';
              final digits = v.replaceAll(RegExp(r'\D'), '');
              if (digits.length != 11) return 'Введите полный номер телефона';
              return null;
            },
          ),
          const SizedBox(height: 6),
          const Text(
            'По умолчанию подставлен ваш номер входа. Можно изменить.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),

          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                border: Border.all(color: const Color(0xFFFECACA)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                _error!,
                style: const TextStyle(fontSize: 13, color: AppColors.brand),
              ),
            ),
          ],

          const SizedBox(height: 28),
          FilledButton(
            onPressed: _saving ? null : _save,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text(
                    'Сохранить',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
          ),
        ],
      ),
    );
  }
}
