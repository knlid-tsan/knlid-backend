import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';
import 'screens/phone_screen.dart';
import 'screens/home_screen.dart';

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
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E293B),
        ),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (_) => const SplashScreen(),
        '/phone': (_) => const PhoneScreen(),
        '/home': (_) => const HomeScreen(),
      },
    );
  }
}
