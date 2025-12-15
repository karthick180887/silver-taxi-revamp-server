import 'package:flutter/material.dart';
import 'booking_review_screen.dart';
import '../api_client.dart';
import '../design_system.dart';

class VehicleSelectionScreen extends StatefulWidget {
  const VehicleSelectionScreen({
    super.key,
    required this.token,
    required this.pickupLocation,
    required this.dropLocation,
    required this.pickupDateTime,
    required this.tripType,
    required this.serviceId,
  });
  final String token;
  final Map<String, dynamic> pickupLocation;
  final Map<String, dynamic> dropLocation;
  final DateTime pickupDateTime;
  final String tripType;
  final String serviceId;

  @override
  State<VehicleSelectionScreen> createState() => _VehicleSelectionScreenState();
}

class _VehicleSelectionScreenState extends State<VehicleSelectionScreen> {
  String? _selectedVehicleTypeId;
  double? _selectedFare;
  // We'll store the full vehicle object to get price etc easily
  Map<String, dynamic>? _selectedVehicle; 
  bool _isLoading = true;
  List<Map<String, dynamic>> _vehicleTypes = [];

  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);

  @override
  void initState() {
    super.initState();
    _fetchVehicles();
  }

  Future<void> _fetchVehicles() async {
    print('DEBUG: _fetchVehicles called for serviceId: ${widget.serviceId}');
    try {
      final result = await _apiClient.getVehiclesByService(
        token: widget.token,
        adminId: 'admin-1',
        serviceId: widget.serviceId,
      );
      print('DEBUG: API Result: ${result.statusCode} - ${result.body}');

      if (mounted) {
        setState(() {
          _isLoading = false;
          if (result.success && result.body['data'] != null) {
            _vehicleTypes = List<Map<String, dynamic>>.from(result.body['data']);
            print('DEBUG: Loaded ${_vehicleTypes.length} vehicles');
          } else {
            print('DEBUG: API returned success=false or no data');
            ScaffoldMessenger.of(context).showSnackBar(
               SnackBar(content: Text('No vehicles found: ${result.body['message'] ?? "Unknown error"}')),
            );
          }
        });
      }
    } catch (e) {
      print('DEBUG: Exception in _fetchVehicles: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load vehicles: $e')),
        );
      }
    }
  }

  void _proceedToReview() {
    if (_selectedVehicleTypeId == null || _selectedVehicle == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a vehicle')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BookingReviewScreen(
          token: widget.token,
          pickupLocation: widget.pickupLocation,
          dropLocation: widget.dropLocation,
          pickupDateTime: widget.pickupDateTime,
          tripType: widget.tripType,
          vehicleTypeId: _selectedVehicle!['tariffId'], // Use tariffId as 'vehicleTypeId' for booking
          finalAmount: (_selectedVehicle!['price'] as num).toDouble(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Vehicle'),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Column(
        children: [
          // Trip Details Card
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Show the selected service in the header instead of hardcoded Mock
                  Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.location_city, size: 30),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.tripType,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.green, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.pickupLocation['address'] as String? ?? 'Pickup',
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.red, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.dropLocation['address'] as String? ?? 'Drop',
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Vehicle Selection
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Select Vehicle',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 16),

          Expanded(
            child: _vehicleTypes.isEmpty 
              ? const Center(child: Text("No vehicles available for this service"))
              : ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _vehicleTypes.length,
              itemBuilder: (context, index) {
                final vehicle = _vehicleTypes[index];
                // Use tariffId or vehicleId for unique selection
                final id = vehicle['id'] as String; 
                final isSelected = _selectedVehicleTypeId == id;

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedVehicleTypeId = id;
                      _selectedVehicle = vehicle;
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? Colors.amber : Colors.grey[300]!,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: vehicle['image'] != null && (vehicle['image'] as String).startsWith('http')
                                ? Image.network(vehicle['image'])
                                : Text(
                                    vehicle['image'] ?? '🚗',
                                    style: const TextStyle(fontSize: 40),
                                  ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                vehicle['name'] as String,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                vehicle['seaters'] != null ? '${vehicle['seaters']} Seats' : '4+1 Seats',
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  if (vehicle['originalPrice'] != null)
                                    Text(
                                      '₹${vehicle['originalPrice']}',
                                      style: const TextStyle(
                                        decoration: TextDecoration.lineThrough,
                                        color: Colors.grey,
                                        fontSize: 14,
                                      ),
                                    ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '₹${vehicle['price']}',
                                    style: const TextStyle(
                                      color: Colors.black,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          const Icon(
                            Icons.check_circle,
                            color: Colors.amber,
                            size: 28,
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Review Booking Button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _proceedToReview,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.amber,
                  foregroundColor: Colors.black,
                ),
                child: const Text(
                  'Review Booking',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

