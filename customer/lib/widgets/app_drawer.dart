import 'package:flutter/material.dart';
import '../design_system.dart';
import '../screens/notifications_screen.dart';
import '../screens/booking_history_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({
    super.key, 
    required this.customerName, 
    this.phone,
    required this.token,
    required this.customerId,
    required this.adminId,
  });

  final String customerName;
  final String? phone;
  final String token;
  final String customerId;
  final String adminId;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(top: 60, bottom: 20, left: 20, right: 20),
            color: const Color(0xFF0A1E3C), // Dark Blue from screenshot
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.person, size: 40, color: Colors.black),
                ),
                const SizedBox(height: 16),
                Text(
                  customerName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  phone ?? '',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          
          // Menu Items
          Expanded(
            child: Container(
              color: Colors.white,
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildMenuItem(
                    context, 
                    icon: Icons.history, 
                    title: 'Booking History',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => BookingHistoryScreen(
                            token: token,
                            adminId: adminId,
                            customerId: customerId,
                          ),
                        ),
                      );
                    },
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.local_offer, 
                    title: 'Offers',
                    onTap: () {
                      // Navigate to Offers
                    },
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.people, 
                    title: 'Refer',
                    onTap: () {},
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.help_outline, 
                    title: 'Help & Support',
                    onTap: () {},
                  ),
                  _buildMenuItem(
                    context, 
                    icon: Icons.info_outline, 
                    title: 'About',
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, {required IconData icon, required String title, required VoidCallback onTap}) {
    return ListTile(
      leading: Icon(icon, color: Colors.black54),
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.black87,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: () {
        Navigator.pop(context); // Close drawer first
        onTap();
      },
    );
  }
}
