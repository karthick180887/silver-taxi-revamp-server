import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../api_client.dart';
import '../../design_system.dart';
import '../bookings/bookings_screen.dart';
import '../create_booking/create_booking_screen.dart';
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
  Map<String, dynamic>? _profile;
  List<dynamic> _recentBookings = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('vendor_token');
    final adminId = prefs.getString('admin_id');
    final vendorId = prefs.getString('vendor_id');
    
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
      debugPrint('Dashboard: Loading with adminId: $adminId, vendorId: $vendorId');

      if (adminId == null || vendorId == null) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
           const SnackBar(content: Text('Error: Missing Admin/Vendor ID. Re-login required.')),
        );
        return;
      }

      // Load counts and profile
      final resCounts = await _api.getBookingCounts(token: token, adminId: adminId, vendorId: vendorId);
      final profileRes = await _api.fetchProfile(token: token);

      if (resCounts.statusCode == 200 && resCounts.data != null) {
        final body = resCounts.data as Map<String, dynamic>;
        setState(() => _counts = body['data'] as Map<String, dynamic>?);
      }
      
      if (profileRes.statusCode == 200 && profileRes.data != null) {
          final data = profileRes.data;
          // profileRes.data is { success: true, data: { vendor: {...} } } usually, but ApiResult.data typically unwraps.
          // Let's assume ApiResult.data is the JSON body or the data field.
          // Based on Controller: res.json({ data: { vendor: ... } })
          if (data is Map<String, dynamic> && data.containsKey('vendor')) {
             setState(() => _profile = data['vendor']);
          } else if (data['data'] != null && data['data']['vendor'] != null) {
             setState(() => _profile = data['data']['vendor']);
          }
      }
      
      // Load recent bookings
      final resBookings = await _api.getAllBookings(
        token: token,
        adminId: adminId,
        vendorId: vendorId,
      );
      if (resBookings.statusCode == 200 && resBookings.data != null) {
        final body = resBookings.data as Map<String, dynamic>;
        // Handle cases where data might be null or not a list
        if (body['data'] is List) {
          final all = body['data'] as List<dynamic>;
          setState(() {
            _recentBookings = all.take(5).toList();
          });
        } else {
           debugPrint('Dashboard: Bookings data is not a list: ${body['data']}');
           setState(() => _recentBookings = []);
        }
      } else {
        debugPrint('Dashboard: Failed to load bookings. Status: ${resBookings.statusCode}');
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
    await prefs.remove('admin_id');
    await prefs.remove('vendor_id');
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
                  
                  // Top Stats Row
                  Row(
                    children: [
                       Expanded(
                        child: _StatCard(
                          title: 'Total Earnings',
                          value: '₹${_profile?['totalEarnings']?.toString() ?? '0'}',
                          icon: Icons.currency_rupee,
                          color: AppColors.success,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          title: 'Total Trips',
                          value: _profile?['totalTrips']?.toString() ?? '0',
                          icon: Icons.check_circle_outline,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Action Buttons
                  Card(
                    color: AppColors.primary,
                    child: InkWell(
                      onTap: () {
                         Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const CreateBookingScreen()),
                          );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.add_circle_outline, color: Colors.white, size: 28),
                            const SizedBox(width: 12),
                            Text(
                              'Create New Booking',
                              style: AppTextStyles.h3.copyWith(color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Summary Cards
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.3, // Adjusted for better height
                    children: [
                      _SummaryCard(
                        title: 'Total Bookings',
                        value: _counts?['all']?.toString() ?? '0',
                        icon: Icons.confirmation_number_outlined,
                        color: AppColors.primary,
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingsScreen(initialIndex: 0))),
                      ),
                      _SummaryCard(
                        title: 'Confirm / Not Started',
                        value: _counts?['not-started']?.toString() ?? '0',
                        icon: Icons.schedule_outlined,
                        color: AppColors.warning,
                         onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingsScreen(initialIndex: 1))),
                      ),
                      _SummaryCard(
                        title: 'Started',
                        value: _counts?['started']?.toString() ?? '0',
                        icon: Icons.directions_car_filled_outlined,
                        color: AppColors.success,
                         onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingsScreen(initialIndex: 2))),
                      ),
                       _SummaryCard(
                        title: 'Completed',
                        value: _counts?['completed']?.toString() ?? '0',
                        icon: Icons.check_circle_outline,
                        color: AppColors.info,
                         onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingsScreen(initialIndex: 3))),
                      ),
                       _SummaryCard(
                        title: 'Cancelled',
                        value: _counts?['cancelled']?.toString() ?? '0',
                        icon: Icons.cancel_outlined,
                        color: AppColors.error,
                         onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingsScreen(initialIndex: 4))),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  /*
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Recent Activity', style: AppTextStyles.h2),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const BookingsScreen(initialIndex: 0)),
                          );
                        },
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Recent Bookings List
                  if (_recentBookings.isEmpty)
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
                  else
                    ..._recentBookings.map((booking) => Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.primaryLight,
                          child: Icon(
                            _getServiceIcon(booking['serviceType']),
                            color: AppColors.primary,
                            size: 20,
                          ),
                        ),
                        title: Text(
                          booking['pickupAddress'] ?? 'No Address',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.label,
                        ),
                        subtitle: Text(
                          booking['status'] ?? 'Pending',
                          style: TextStyle(
                            color: _getStatusColor(booking['status']),
                            fontSize: 12,
                          ),
                        ),
                        trailing: Text(
                          booking['totalAmount'] != null ? '₹${booking['totalAmount']}' : '₹0',
                          style: AppTextStyles.label,
                        ),
                      ),
                    )),
                  */
                ],
              ),
            ),
    );
  }

  IconData _getServiceIcon(String? type) {
    if (type == null) return Icons.local_taxi;
    final lower = type.toLowerCase();
    if (lower.contains('auto')) return Icons.electric_rickshaw;
    if (lower.contains('bike')) return Icons.two_wheeler;
    return Icons.local_taxi;
  }

  Color _getStatusColor(String? status) {
    if (status == null) return AppColors.textSecondary;
    final lower = status.toLowerCase();
    if (lower.contains('completed')) return AppColors.success;
    if (lower.contains('cancel')) return AppColors.error;
    if (lower.contains('confirm') || lower.contains('accept')) return AppColors.info;
    return AppColors.warning;
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 8),
                Text(title, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
              ],
            ),
            const SizedBox(height: 12),
            Text(value, style: AppTextStyles.h2.copyWith(color: AppColors.textMain)),
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
    this.onTap,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.hardEdge,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Icon(icon, color: color, size: 24),
                ],
              ),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: Text(
                        value,
                        style: AppTextStyles.h1.copyWith(fontSize: 24),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      title,
                      style: AppTextStyles.bodySmall,
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
