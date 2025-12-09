import 'package:flutter/material.dart';
import '../api_client.dart';

class VehicleDetailsPage extends StatefulWidget {
  const VehicleDetailsPage({super.key, required this.token});
  final String token;

  @override
  State<VehicleDetailsPage> createState() => _VehicleDetailsPageState();
}

class _VehicleDetailsPageState extends State<VehicleDetailsPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _vehicles = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.getDriverVehicles(token: widget.token);
      if (!res.success) {
        throw Exception(res.body['message'] ?? 'Failed to load vehicles');
      }
      final list = _extractList(res.body['data']);
      if (mounted) setState(() => _vehicles = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> _extractList(dynamic data) {
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    if (data is Map) {
      final list = data['data'] ?? data['vehicles'] ?? data['items'] ?? data['rows'];
      if (list is List) {
        return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [];
  }

  String _titleFor(Map<String, dynamic> item) {
    final plate = item['license_plate'] ?? item['licensePlate'] ?? item['plate'] ?? '';
    final model = item['model'] ?? item['vehicleModel'] ?? item['vehicle_name'] ?? '';
    if (model.toString().isNotEmpty) return model.toString();
    if (plate.toString().isNotEmpty) return plate.toString();
    return 'Vehicle';
  }

  String _subtitleFor(Map<String, dynamic> item) {
    final plate = item['license_plate'] ?? item['licensePlate'] ?? item['plate'] ?? '';
    final type = item['type'] ?? item['vehicleType'] ?? item['category'] ?? '';
    final status = item['status'] ?? item['state'] ?? '';
    final parts = <String>[];
    if (plate.toString().isNotEmpty) parts.add('Plate: $plate');
    if (type.toString().isNotEmpty) parts.add(type.toString());
    if (status.toString().isNotEmpty) parts.add('Status: ${status.toString()}');
    return parts.isEmpty ? 'No details available' : parts.join(' • ');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle Details')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Unable to load vehicles',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: TextStyle(color: Colors.red.shade600)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  )
                : _vehicles.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          Icon(Icons.directions_car, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Center(
                            child: Text(
                              'No vehicles found',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Center(
                            child: Text(
                              'Pull to refresh after adding a vehicle',
                              style: TextStyle(color: Colors.grey.shade500),
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: _vehicles.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final item = _vehicles[index];
                          final status = (item['status'] ?? item['state'] ?? '').toString();
                          final isActive = status.toLowerCase() == 'active';
                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: Colors.blue.shade50,
                                child: const Icon(Icons.directions_car, color: Colors.blue),
                              ),
                              title: Text(
                                _titleFor(item),
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              subtitle: Text(
                                _subtitleFor(item),
                                style: TextStyle(color: Colors.grey.shade700),
                              ),
                              trailing: status.isEmpty
                                  ? null
                                  : Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isActive ? Colors.green.shade100 : Colors.grey.shade200,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          color: isActive ? Colors.green.shade800 : Colors.grey.shade700,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
