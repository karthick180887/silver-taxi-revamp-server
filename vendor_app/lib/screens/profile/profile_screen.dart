import 'package:flutter/material.dart';
import '../../api_client.dart';
import '../../design_system.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _api = VendorApiClient();
  bool _isLoading = true;
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('vendor_token');
    if (token == null) return;

    try {
      final res = await _api.fetchProfile(token: token);
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _profile = res.data as Map<String, dynamic>;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('vendor_token');
    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  const CircleAvatar(
                    radius: 50,
                    backgroundColor: AppColors.primaryLight,
                    child: Icon(Icons.person, size: 50, color: AppColors.primary),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _profile?['name'] ?? 'Vendor Name',
                    style: AppTextStyles.h2,
                  ),
                  Text(
                    _profile?['email'] ?? '',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 32),
                  
                  // Details Card
                  Card(
                    child: Column(
                      children: [
                        ListTile(
                          leading: const Icon(Icons.phone),
                          title: const Text('Phone'),
                          subtitle: Text(_profile?['phone'] ?? 'N/A'),
                        ),
                        const Divider(),
                        ListTile(
                          leading: const Icon(Icons.email),
                          title: const Text('Email'),
                          subtitle: Text(_profile?['email'] ?? 'N/A'),
                        ),
                        const Divider(),
                        ListTile(
                          leading: const Icon(Icons.location_on),
                          title: const Text('Address'),
                          subtitle: Text(_profile?['address'] ?? 'N/A'),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _logout,
                      icon: const Icon(Icons.logout),
                      label: const Text('Logout'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
