import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/phone_formatter.dart';
import 'otp_screen.dart';

class PhoneScreen extends StatefulWidget {
  const PhoneScreen({super.key});

  @override
  State<PhoneScreen> createState() => _PhoneScreenState();
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

class _KnLidLogo extends StatelessWidget {
  const _KnLidLogo();

  static const _red = Color(0xFFDA251C);
  static const _style = TextStyle(
    fontSize: 52,
    fontWeight: FontWeight.w700,
    color: _red,
    height: 1,
    letterSpacing: -1.5,
  );

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Text('kn', style: _style),
            const SizedBox(width: 3),
            Container(
              width: 17,
              height: 17,
              decoration: const BoxDecoration(
                color: _red,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.home, size: 11, color: Colors.white),
            ),
            const SizedBox(width: 3),
            const Text('lid', style: _style),
          ],
        ),
        const SizedBox(height: 10),
        const Text(
          'ПЕРЕДАЧА ЛИДОВ МЕЖДУ СПЕЦИАЛИСТАМИ',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w400,
            color: Color(0xFF6B7280),
            letterSpacing: 2.5,
          ),
        ),
      ],
    );
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

class _PhoneScreenState extends State<PhoneScreen> {
  final _phoneController = TextEditingController(text: '+7 ');
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();

  bool _loading = false;
  String _error = '';

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp(AuthMode mode) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final phone = stripPhone(_phoneController.text);
      await _authService.requestOtp(phone);
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => OtpScreen(phone: phone, mode: mode),
        ),
      );
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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 64),
                const Center(child: _KnLidLogo()),
                const SizedBox(height: 56),
                const Text(
                  'Введите номер телефона',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Вам будет отправлен код подтверждения',
                  style: TextStyle(fontSize: 14, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [PhoneMaskFormatter()],
                  style: const TextStyle(fontSize: 18, letterSpacing: 1),
                  decoration: const InputDecoration(
                    labelText: 'Номер телефона',
                    hintText: '+7 705 000 00 00',
                    filled: true,
                    fillColor: Color(0xFFF1F5F9),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                      borderSide: BorderSide(color: Color(0xFF1E293B), width: 1.5),
                    ),
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                  ),
                  validator: (v) {
                    final phone = v?.trim() ?? '';
                    if (phone.length < 10) return 'Введите корректный номер';
                    return null;
                  },
                ),
                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error,
                    style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13),
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading ? null : () => _requestOtp(AuthMode.login),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF1E293B),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Войти',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _loading ? null : () => _requestOtp(AuthMode.register),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1E293B),
                    side: const BorderSide(color: Color(0xFF1E293B)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Зарегистрироваться',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
