import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import 'register_screen.dart';

enum AuthMode { login, register }

class OtpScreen extends StatefulWidget {
  final String phone;
  final AuthMode mode;
  const OtpScreen({super.key, required this.phone, required this.mode});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _codeController = TextEditingController();
  final _authService = AuthService();
  final _client = ApiClient();

  bool _loading = false;
  String _error = '';
  bool _showRegisterHint = false;

  // Resend cooldown
  static const _resendCooldown = 60;
  int _secondsLeft = _resendCooldown;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _codeController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _secondsLeft = _resendCooldown;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft == 0) {
        t.cancel();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  Future<void> _resend() async {
    setState(() => _error = '');
    try {
      await _authService.requestOtp(widget.phone);
      _startTimer();
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _submit() async {
    if (_loading) return;
    final code = _codeController.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Введите 6-значный код');
      return;
    }

    if (widget.mode == AuthMode.login) {
      await _login(code);
    } else {
      _goToRegister(code);
    }
  }

  Future<void> _login(String code) async {
    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final token = await _authService.verifyOtp(
        phone: widget.phone,
        code: code,
      );
      await _client.saveToken(token);
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(context, '/home', (r) => false);
    } catch (e) {
      final msg = e.toString();
      setState(() {
        _error = msg;
        _showRegisterHint = msg.contains('не найден');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _goToRegister(String code) {
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => RegisterScreen(phone: widget.phone, code: code),
      ),
    );
  }

  String get _buttonLabel =>
      widget.mode == AuthMode.login ? 'Войти' : 'Продолжить';

  String _formatPhone(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 11 && digits.startsWith('7')) {
      return '+7 ${digits.substring(1, 4)} ${digits.substring(4, 7)} '
          '${digits.substring(7, 9)} ${digits.substring(9, 11)}';
    }
    return raw;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              Text(
                widget.mode == AuthMode.login ? 'Введите код' : 'Подтвердите номер',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Код отправлен в WhatsApp на номер ${_formatPhone(widget.phone)}',
                style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),

              // Dev hint
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  border: Border.all(color: const Color(0xFFFCD34D)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, size: 16, color: Color(0xFF92400E)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Режим разработки: код смотрите в логах бэкенда (npm run start)',
                        style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              TextFormField(
                controller: _codeController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                style: const TextStyle(
                  fontSize: 28,
                  letterSpacing: 8,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
                decoration: const InputDecoration(
                  counterText: '',
                  hintText: '000000',
                  hintStyle: TextStyle(
                    letterSpacing: 8,
                    color: AppColors.divider,
                    fontSize: 28,
                  ),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                    borderSide: BorderSide(color: AppColors.primary, width: 1.5),
                  ),
                  contentPadding: EdgeInsets.symmetric(vertical: 20),
                ),
                onChanged: (v) {
                  if (v.length == 6) _submit();
                },
              ),

              if (_error.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  _error,
                  style: const TextStyle(color: AppColors.brand, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                if (_showRegisterHint) ...[
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => _goToRegister(_codeController.text.trim()),
                    child: const Text(
                      'Зарегистрироваться с этим номером →',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ],

              const SizedBox(height: 24),
              FilledButton(
                onPressed: _loading ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
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
                    : Text(
                        _buttonLabel,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),

              const SizedBox(height: 16),
              Center(
                child: _secondsLeft > 0
                    ? Text(
                        'Отправить повторно через $_secondsLeft с',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      )
                    : TextButton(
                        onPressed: _resend,
                        child: const Text(
                          'Отправить повторно',
                          style: TextStyle(color: AppColors.primary),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
