import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';
import 'home_screen.dart';
import 'leads_created_screen.dart';
import 'leads_assigned_screen.dart';
import 'tariffs_screen.dart';
import 'profile_screen.dart';
import 'create_lead_screen.dart';
import 'verification_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  int _homeRevision = 0;
  int _createdRevision = 0;
  int _profileRevision = 0;
  String _role = '';
  String _userStatus = '';
  String? _rejectionReason;

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    final token = await ApiClient().getToken();
    if (token == null || !mounted) return;
    try {
      // Role from JWT (fast, no network)
      final payload = ApiClient().decodeTokenPayload(token);
      final role = payload['role'] as String? ?? '';
      if (mounted) setState(() => _role = role);

      // Status from API (for banner) — only needed for specialists
      if (role == 'user') {
        final res = await ApiClient().dio.get('/users/me');
        final data = res.data as Map<String, dynamic>;
        final status = data['status'] as String? ?? '';
        final reason = data['verification_rejection_reason'] as String?;
        if (mounted) setState(() {
          _userStatus = status;
          _rejectionReason = reason;
        });
      }
    } catch (_) {}
  }

  Future<void> _refreshUserStatus() async {
    if (_role != 'user') return;
    try {
      final res = await ApiClient().dio.get('/users/me');
      final data = res.data as Map<String, dynamic>;
      final status = data['status'] as String? ?? '';
      final reason = data['verification_rejection_reason'] as String?;
      if (mounted) setState(() {
        _userStatus = status;
        _rejectionReason = reason;
      });
    } catch (_) {}
  }

  void _openVerification() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const VerificationScreen()),
    );
    _refreshUserStatus();
  }

  bool get _showBanner =>
      _role == 'user' && _userStatus.isNotEmpty && _userStatus != 'active' && _currentIndex < 4;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      body: Column(
        children: [
          if (_showBanner)
            _VerificationBanner(
              status: _userStatus,
              rejectionReason: _rejectionReason,
              onTap: _openVerification,
            ),
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: [
                HomeScreen(
                  key: ValueKey(_homeRevision),
                  onLeadCreated: () => setState(() => _createdRevision++),
                ),
                LeadsCreatedScreen(key: ValueKey(_createdRevision)),
                const LeadsAssignedScreen(),
                const TariffsScreen(),
                ProfileScreen(key: ValueKey(_profileRevision)),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: _role == 'user' && (_currentIndex == 1 || _currentIndex == 2)
          ? FloatingActionButton.extended(
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreateLeadScreen()),
                );
                if (mounted) setState(() => _createdRevision++);
              },
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: Text(
                l.btnCreateLead,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) {
          setState(() {
            _currentIndex = i;
            if (i == 0) _homeRevision++;
            if (i == 4) _profileRevision++;
          });
          if (i < 3) _refreshUserStatus();
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: l.navHome,
          ),
          NavigationDestination(
            icon: const Icon(Icons.send_outlined),
            selectedIcon: const Icon(Icons.send),
            label: l.navCreatedShort,
          ),
          NavigationDestination(
            icon: const Icon(Icons.assignment_outlined),
            selectedIcon: const Icon(Icons.assignment),
            label: l.navAssignedShort,
          ),
          NavigationDestination(
            icon: const Icon(Icons.percent_outlined),
            selectedIcon: const Icon(Icons.percent),
            label: l.navTariffs,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: l.navProfile,
          ),
        ],
      ),
    );
  }
}

// ─── Banner ───────────────────────────────────────────────────────────────────

class _VerificationBanner extends StatelessWidget {
  final String status;
  final String? rejectionReason;
  final VoidCallback onTap;

  const _VerificationBanner({
    required this.status,
    required this.rejectionReason,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final topPadding = MediaQuery.of(context).padding.top;
    final isRejected = status == 'new' && rejectionReason != null;
    final isPending = status == 'pending';

    final Color bgColor;
    final Color iconColor;
    final Color textColor;
    final String message;
    final String? cta;

    if (isPending) {
      bgColor = const Color(0xFFFEF3C7);
      iconColor = const Color(0xFFF59E0B);
      textColor = const Color(0xFF92400E);
      message = l.bannerPending;
      cta = null;
    } else if (isRejected) {
      bgColor = const Color(0xFFFEF2F2);
      iconColor = const Color(0xFFDC2626);
      textColor = const Color(0xFF991B1B);
      message = l.bannerRejected;
      cta = '→';
    } else {
      bgColor = const Color(0xFFFFF7ED);
      iconColor = const Color(0xFFF59E0B);
      textColor = const Color(0xFF92400E);
      message = l.bannerNotVerified;
      cta = l.bannerCta;
    }

    return GestureDetector(
      onTap: cta != null ? onTap : null,
      child: Container(
        width: double.infinity,
        color: bgColor,
        padding: EdgeInsets.fromLTRB(16, topPadding + 10, 16, 10),
        child: Row(
          children: [
            Icon(Icons.info_outline, size: 16, color: iconColor),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                style: TextStyle(
                  fontSize: 12,
                  color: textColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            if (cta != null) ...[
              const SizedBox(width: 8),
              Text(
                cta,
                style: TextStyle(
                  fontSize: 12,
                  color: textColor,
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                  decorationColor: textColor,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
