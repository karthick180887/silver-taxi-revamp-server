import 'package:flutter/material.dart';
import '../api_client.dart';
import '../services/storage_service.dart';
import 'login_page.dart';
import 'analytics_page.dart';
import 'earnings_page.dart';
import 'notification_settings_page.dart';
import 'payment_details_page.dart';
import 'payout_request_page.dart';
import 'vehicle_details_page.dart';
import 'driver_details_page.dart';
import '../design_system.dart';

class MenuTab extends StatefulWidget {
  const MenuTab({super.key, required this.token});
  final String token;

  @override
  State<MenuTab> createState() => _MenuTabState();
}

class _MenuTabState extends State<MenuTab> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await _api.fetchDriverDetails(token: widget.token);
      if (mounted) setState(() => _profile = res['data']);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final name = _profile?['name'] ?? 'Driver';
    final phone = _profile?['phone'] ?? '';
    final rating = _profile?['rating'] ?? 0.0;
    final photo = _profile?['driverImageUrl'] ?? _profile?['profilePicture'];
    final totalEarnings = _profile?['totalEarnings']?.toString() ?? '0';
    final bookingCount = _profile?['bookingCount'] ?? 0;
    final referralCode = _profile?['referralCode']?.toString() ?? '';
    final driverId = _profile?['driverId']?.toString() ?? '';
    final isOnline = _profile?['isOnline'] ?? false;
    final adminVerified = _profile?['adminVerified']?.toString() ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Menu', style: AppTextStyles.h2),
        automaticallyImplyLeading: false,
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.secondary, width: 2),
                          image: photo != null && photo.isNotEmpty 
                              ? DecorationImage(
                                  image: NetworkImage(transformImageUrl(photo)),
                                  fit: BoxFit.cover) 
                              : null,
                        ),
                        child: photo == null || photo.isEmpty ? const Icon(Icons.person, size: 30, color: AppColors.textTertiary) : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: AppTextStyles.h3),
                            Text(phone, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textTertiary)),
                            if (driverId.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                'ID: $driverId',
                                style: AppTextStyles.bodySmall,
                              ),
                            ],
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                if (rating > 0) ...[
                                  const Icon(Icons.star, color: AppColors.secondary, size: 16),
                                  Text(' $rating', style: AppTextStyles.label),
                                  const SizedBox(width: 12),
                                ],
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isOnline ? AppColors.success.withOpacity(0.1) : AppColors.border,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: isOnline ? AppColors.success : AppColors.textTertiary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        isOnline ? 'Online' : 'Offline',
                                        style: AppTextStyles.bodySmall.copyWith(
                                          color: isOnline ? AppColors.success : AppColors.textTertiary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppColors.textTertiary),
                    ],
                  ),
                  const Divider(height: 24, color: AppColors.divider),
                  // Additional Profile Info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatItem('Total Earnings', '₹${_formatEarnings(totalEarnings)}', Icons.account_balance_wallet),
                      _buildStatItem('Bookings', '$bookingCount', Icons.directions_car),
                      if (referralCode.isNotEmpty)
                        _buildStatItem('Referral', referralCode, Icons.card_giftcard),
                    ],
                  ),
                  if (adminVerified.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: adminVerified.toLowerCase() == 'approved' 
                            ? AppColors.success.withOpacity(0.1) 
                            : AppColors.secondary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            adminVerified.toLowerCase() == 'approved' ? Icons.check_circle : Icons.pending,
                            size: 16,
                            color: adminVerified.toLowerCase() == 'approved' 
                                ? AppColors.success 
                                : AppColors.secondary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Status: $adminVerified',
                            style: AppTextStyles.bodySmall.copyWith(
                              fontWeight: FontWeight.w600,
                              color: adminVerified.toLowerCase() == 'approved' 
                                  ? AppColors.success 
                                  : AppColors.secondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Menu Items
            _buildMenuSection([
              _MenuItem(
                'Analytics',
                Icons.bar_chart,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => AnalyticsPage(token: widget.token)),
                ),
              ),
              _MenuItem(
                'Earnings',
                Icons.account_balance_wallet,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => EarningsPage(token: widget.token)),
                ),
              ),
              _MenuItem(
                'Notifications Settings',
                Icons.notifications_none,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => NotificationSettingsPage(token: widget.token)),
                ),
              ),
              _MenuItem(
                'Vehicle Details',
                Icons.directions_car,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => VehicleDetailsPage(token: widget.token)),
                ),
              ),
              _MenuItem(
                'Payment Details',
                Icons.attach_money,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => PaymentDetailsPage(token: widget.token)),
                ),
              ),
              _MenuItem(
                'Payout Requests',
                Icons.account_balance_wallet,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => PayoutRequestPage(token: widget.token)),
                ),
              ),
              _MenuItem(
                'Driver Details',
                Icons.person,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => DriverDetailsPage(token: widget.token)),
                ),
              ),
            ]),
            const SizedBox(height: 24),

            _buildMenuSection([
              _MenuItem('Help', Icons.help_outline, () {}),
              _MenuItem('About', Icons.info_outline, () {}),
              _MenuItem('Support', Icons.headset_mic, () {}),
            ]),
            const SizedBox(height: 24),

            _buildMenuSection([
              _MenuItem('Log Out', Icons.logout, () async {
                // Show confirmation dialog
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Log Out'),
                    content: const Text('Are you sure you want to log out?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Cancel'),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Log Out'),
                      ),
                    ],
                  ),
                );
                
                if (confirm == true && mounted) {
                  // Clear local storage
                  await StorageService.clearAll();
                  
                  // Navigate to login page and clear navigation stack
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginPage()),
                    (route) => false,
                  );
                }
              }, isDestructive: true),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuSection(List<_MenuItem> items) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        children: items.map((item) {
          return ListTile(
            leading: Icon(item.icon, color: item.isDestructive ? AppColors.error : AppColors.textPrimary),
            title: Text(
              item.title, 
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w500, 
                color: item.isDestructive ? AppColors.error : AppColors.textPrimary
              )
            ),
            trailing: const Icon(Icons.chevron_right, size: 20, color: AppColors.textTertiary),
            onTap: item.onTap,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: AppTextStyles.h3.copyWith(fontSize: 16),
        ),
        Text(
          label,
          style: AppTextStyles.bodySmall,
        ),
      ],
    );
  }

  String _formatEarnings(String value) {
    try {
      final num = double.tryParse(value) ?? 0;
      if (num >= 100000) {
        return '${(num / 100000).toStringAsFixed(1)}L';
      } else if (num >= 1000) {
        return '${(num / 1000).toStringAsFixed(1)}K';
      }
      return num.toStringAsFixed(0);
    } catch (e) {
      return value;
    }
  }
}

class _MenuItem {
  final String title;
  final IconData icon;
  final VoidCallback onTap;
  final bool isDestructive;
  _MenuItem(this.title, this.icon, this.onTap, {this.isDestructive = false});
}

