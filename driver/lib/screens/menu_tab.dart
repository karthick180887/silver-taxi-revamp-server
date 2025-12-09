import 'package:flutter/material.dart';
import '../api_client.dart';
import 'analytics_page.dart';
import 'earnings_page.dart';
import 'notification_settings_page.dart';
import 'payment_details_page.dart';
import 'payout_request_page.dart';
import 'vehicle_details_page.dart';

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
      appBar: AppBar(title: const Text('Menu'), automaticallyImplyLeading: false),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundImage: photo != null && photo.isNotEmpty 
                            ? NetworkImage(transformImageUrl(photo)) 
                            : null,
                        child: photo == null || photo.isEmpty ? const Icon(Icons.person, size: 30) : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            Text(phone, style: TextStyle(color: Colors.grey.shade600)),
                            if (driverId.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                'ID: $driverId',
                                style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                              ),
                            ],
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                if (rating > 0) ...[
                                  const Icon(Icons.star, color: Colors.amber, size: 16),
                                  Text(' $rating', style: const TextStyle(fontWeight: FontWeight.w600)),
                                  const SizedBox(width: 12),
                                ],
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isOnline ? Colors.green.shade50 : Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: isOnline ? Colors.green : Colors.grey,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        isOnline ? 'Online' : 'Offline',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isOnline ? Colors.green.shade700 : Colors.grey.shade700,
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
                      const Icon(Icons.chevron_right),
                    ],
                  ),
                  const Divider(height: 24),
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
                            ? Colors.green.shade50 
                            : Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            adminVerified.toLowerCase() == 'approved' ? Icons.check_circle : Icons.pending,
                            size: 16,
                            color: adminVerified.toLowerCase() == 'approved' 
                                ? Colors.green.shade700 
                                : Colors.orange.shade700,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Status: $adminVerified',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: adminVerified.toLowerCase() == 'approved' 
                                  ? Colors.green.shade700 
                                  : Colors.orange.shade700,
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
            ]),
            const SizedBox(height: 24),

            _buildMenuSection([
              _MenuItem('Help', Icons.help_outline, () {}),
              _MenuItem('About', Icons.info_outline, () {}),
              _MenuItem('Support', Icons.headset_mic, () {}),
            ]),
            const SizedBox(height: 24),

            _buildMenuSection([
              _MenuItem('Log Out', Icons.logout, () => Navigator.of(context).popUntil((r) => r.isFirst), isDestructive: true),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuSection(List<_MenuItem> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
      ),
      child: Column(
        children: items.map((item) {
          return ListTile(
            leading: Icon(item.icon, color: item.isDestructive ? Colors.red : Colors.black87),
            title: Text(
              item.title, 
              style: TextStyle(
                fontWeight: FontWeight.w500, 
                color: item.isDestructive ? Colors.red : Colors.black87
              )
            ),
            trailing: const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
            onTap: item.onTap,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF2575FC), size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.grey.shade600,
          ),
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

