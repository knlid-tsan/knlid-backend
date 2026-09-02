import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'l10n/app_localizations.dart';
import 'screens/splash_screen.dart';
import 'screens/phone_screen.dart';
import 'screens/main_screen.dart';
import 'theme/app_theme.dart';
import 'services/navigator_key.dart';
import 'services/locale_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Светлая тема приложения → иконки статус-бара и системной навигации
  // должны быть тёмными. Единый стиль — AppTheme.overlayStyle (он же в
  // AppBarTheme и в AnnotatedRegion ниже).
  SystemChrome.setSystemUIOverlayStyle(AppTheme.overlayStyle);
  runApp(const KnlidApp());
}

class KnlidApp extends StatefulWidget {
  const KnlidApp({super.key});

  static _KnlidAppState? of(BuildContext context) =>
      context.findAncestorStateOfType<_KnlidAppState>();

  @override
  State<KnlidApp> createState() => _KnlidAppState();
}

class _KnlidAppState extends State<KnlidApp> {
  Locale _locale = const Locale('ru');

  @override
  void initState() {
    super.initState();
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    final locale = await LocaleService.load();
    if (mounted) setState(() => _locale = locale);
  }

  Future<void> setLocale(Locale locale) async {
    await LocaleService.save(locale);
    if (mounted) setState(() => _locale = locale);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'KN.LID',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      locale: _locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      // Глобальный стиль системных панелей для экранов без AppBar
      // (главные вкладки): тёмные иконки нижней навигации на светлом фоне
      builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
        value: AppTheme.overlayStyle,
        child: child!,
      ),
      initialRoute: '/',
      routes: {
        '/': (_) => const SplashScreen(),
        '/phone': (_) => const PhoneScreen(),
        '/home': (_) => const MainScreen(),
      },
    );
  }
}
