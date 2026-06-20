import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../services/phone_formatter.dart';
import '../theme/app_colors.dart';
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
    final l = AppLocalizations.of(context)!;
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
        Text(
          l.appSubtitle,
          style: const TextStyle(
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
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
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
                Text(
                  l.phoneTitle,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l.phoneHint,
                  style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [PhoneMaskFormatter()],
                  style: const TextStyle(fontSize: 18, letterSpacing: 1),
                  decoration: InputDecoration(
                    labelText: l.phoneLabel,
                    hintText: '+7 705 000 00 00',
                  ),
                  validator: (v) {
                    final phone = v?.trim() ?? '';
                    if (phone.length < 10) return l.phoneInvalid;
                    return null;
                  },
                ),
                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error,
                    style: const TextStyle(
                      color: AppColors.brand,
                      fontSize: 13,
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading ? null : () => _requestOtp(AuthMode.login),
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(l.btnLogin),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _loading ? null : () => _requestOtp(AuthMode.register),
                  child: Text(l.btnRegister),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
