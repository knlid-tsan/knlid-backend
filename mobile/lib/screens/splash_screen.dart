import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final valid = await ApiClient().hasValidToken();
    if (!mounted) return;
    if (valid) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      Navigator.pushReplacementNamed(context, '/phone');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: _SplashLogo(),
      ),
    );
  }
}

// Same logo as the login screen (_KnLidLogo in phone_screen.dart):
// kn●lid in brand red with the house-in-dot icon, subtitle in small gray caps.
class _SplashLogo extends StatelessWidget {
  const _SplashLogo();

  static const _red = AppColors.brand;
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
