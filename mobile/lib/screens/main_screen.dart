import 'package:flutter/material.dart';
import '../services/api_client.dart';
import 'leads_created_screen.dart';
import 'leads_assigned_screen.dart';
import 'profile_screen.dart';
import 'create_lead_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  String _role = '';

  @override
  void initState() {
    super.initState();
    _loadRole();
  }

  Future<void> _loadRole() async {
    final token = await ApiClient().getToken();
    if (token == null || !mounted) return;
    try {
      final payload = ApiClient().decodeTokenPayload(token);
      setState(() => _role = payload['role'] as String? ?? '');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          LeadsCreatedScreen(),
          LeadsAssignedScreen(),
          ProfileScreen(),
        ],
      ),
      floatingActionButton: _role == 'user' && _currentIndex < 2
          ? FloatingActionButton.extended(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CreateLeadScreen()),
              ),
              backgroundColor: const Color(0xFF1E293B),
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text(
                'Создать лид',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.send_outlined),
            selectedIcon: Icon(Icons.send),
            label: 'Переданные',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment),
            label: 'Исполняю',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Профиль',
          ),
        ],
      ),
    );
  }
}
