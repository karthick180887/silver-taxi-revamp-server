import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../api_client.dart';
import '../../design_system.dart';
import '../auth/login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = VendorApiClient();
  bool _isLoading = true;
  String? _token;
  Map<String, dynamic>? _counts;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('vendor_token');
    
    if (token == null) {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
      return;
    }

    setState(() => _token = token);

    try {
      final res = await _api.getBookingCounts(token: token);
      if (res.statusCode == 200) {
        setState(() => _counts = res.data as Map<String, dynamic>?);
      }
    } catch (e) {
      debugPrint('Error loading dashboard: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('vendor_token');
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text('Overview', style: AppTextStyles.h2),
                  const SizedBox(height: 16),
                  
                  // Summary Cards
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.5,
                    children: [
                      _SummaryCard(
                        title: 'Total Bookings',
                        value: _counts?['total']?.toString() ?? '0',
                        icon: Icons.confirmation_number_outlined,
                        color: AppColors.primary,
                      ),
                      _SummaryCard(
                        title: 'Active Trips',
                        value: _counts?['active']?.toString() ?? '0',
                        icon: Icons.directions_car_filled_outlined,
                        color: AppColors.success,
                      ),
                       _SummaryCard(
                        title: 'Completed',
                        value: _counts?['completed']?.toString() ?? '0',
                        icon: Icons.check_circle_outline,
                        color: AppColors.info,
                      ),
                       _SummaryCard(
                        title: 'Cancelled',
                        value: _counts?['cancelled']?.toString() ?? '0',
                        icon: Icons.cancel_outlined,
                        color: AppColors.error,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  Text('Recent Activity', style: AppTextStyles.h2),
                  const SizedBox(height: 16),
                  
                  // Placeholder for Booking List
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Center(
                         child: Text(
                           'No recent bookings',
                           style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                         ),
                      ),
                    ),
                  )
                ],
              ),
            ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 24),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: AppTextStyles.h1.copyWith(fontSize: 28),
                ),
                Text(
                  title,
                  style: AppTextStyles.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
