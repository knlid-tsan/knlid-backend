import 'package:flutter/material.dart';
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

// Matches the native iOS launch screen: kn●lid in brand red, no subtitle
class _SplashLogo extends StatelessWidget {
  const _SplashLogo();

  static const _red = AppColors.brand;
  static const _style = TextStyle(
    fontSize: 52,
    fontWeight: FontWeight.w700,
    color: _red,
    height: 1,
    letterSpacing: -2,
  );

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Text('kn', style: _style),
        const SizedBox(width: 4),
        Container(
          width: 18,
          height: 18,
          decoration: const BoxDecoration(
            color: _red,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.home, size: 11, color: Colors.white),
        ),
        const SizedBox(width: 4),
        const Text('lid', style: _style),
      ],
    );
  }
}
