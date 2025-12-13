import 'package:flutter/material.dart';
import '../../api_client.dart';
import '../../design_system.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DriversListScreen extends StatefulWidget {
  const DriversListScreen({super.key});

  @override
  State<DriversListScreen> createState() => _DriversListScreenState();
}

class _DriversListScreenState extends State<DriversListScreen> {
  final _api = VendorApiClient();
  bool _isLoading = true;
  List<dynamic> _drivers = [];

  @override
  void initState() {
    super.initState();
    _fetchDrivers();
  }

  Future<void> _fetchDrivers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('vendor_token');
    if (token == null) return;

    try {
      final res = await _api.getDrivers(token: token);
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _drivers = res.data as List<dynamic>;
            _isLoading = false;
          });
        }
      } else {
        // Fallback or empty
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Drivers')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _drivers.isEmpty
              ? Center(
                  child: Text('No drivers found', style: AppTextStyles.bodyMedium),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _drivers.length,
                  itemBuilder: (context, index) {
                    final driver = _drivers[index];
                    return Card(
                      child: ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: AppColors.primaryLight,
                          child: Icon(Icons.person, color: AppColors.primary),
                        ),
                        title: Text(driver['name'] ?? 'Unknown Driver', style: AppTextStyles.label),
                        subtitle: Text(driver['phone'] ?? 'No phone'),
                        trailing: IconButton(
                          icon: const Icon(Icons.phone, color: AppColors.success),
                          onPressed: () {
                            // Call driver logic
                          },
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
