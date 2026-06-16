import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';
import 'screens/phone_screen.dart';
import 'screens/main_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const KnlidApp());
}

class KnlidApp extends StatelessWidget {
  const KnlidApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KN.LID',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: '/',
      routes: {
        '/': (_) => const SplashScreen(),
        '/phone': (_) => const PhoneScreen(),
        '/home': (_) => const MainScreen(),
      },
    );
  }
}
