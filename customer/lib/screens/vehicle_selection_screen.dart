import 'package:flutter/material.dart';
import 'package:characters/characters.dart';
import '../models/customer_models.dart';
import 'booking_review_screen.dart';

class VehicleSelectionScreen extends StatefulWidget {
  const VehicleSelectionScreen({
    super.key,
    required this.token,
    required this.pickupLocation,
    required this.dropLocation,
    required this.pickupDateTime,
    required this.serviceType,
    required this.vehicles,
    this.returnDate,
    this.serviceId,
  });
  final String token;
  final Map<String, dynamic> pickupLocation;
  final Map<String, dynamic> dropLocation;
  final DateTime pickupDateTime;
  final DateTime? returnDate;
  final String serviceType;
  final String? serviceId;
  final List<EstimatedVehicle> vehicles;

  @override
  State<VehicleSelectionScreen> createState() => _VehicleSelectionScreenState();
}

class _VehicleSelectionScreenState extends State<VehicleSelectionScreen> {
  EstimatedVehicle? _selectedVehicle;
  EstimatedFare? _selectedFare;

  void _selectVehicle(EstimatedVehicle vehicle, EstimatedFare fare) {
    setState(() {
      _selectedVehicle = vehicle;
      _selectedFare = fare;
    });
  }

  void _proceedToReview() {
    if (_selectedVehicle == null || _selectedFare == null) {
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
          returnDate: widget.returnDate,
          serviceType: widget.serviceType,
          serviceId: widget.serviceId,
          vehicle: _selectedVehicle!,
          fare: _selectedFare!,
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
      body: Column(
        children: [
          // Trip Details Card
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.directions_car, size: 30),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.serviceType,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              widget.pickupLocation['address'] as String? ?? '',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
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
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: widget.vehicles.length,
              itemBuilder: (context, index) {
                final vehicle = widget.vehicles[index];
                final fare = vehicle.fares.isNotEmpty ? vehicle.fares.first : null;
                final isSelected = _selectedVehicle?.vehicleId == vehicle.vehicleId;

                return GestureDetector(
                  onTap: fare == null ? null : () => _selectVehicle(vehicle, fare),
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
                            child: Text(
                              vehicle.vehicleType.characters.first,
                              style: const TextStyle(fontSize: 32),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                vehicle.vehicleType,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (vehicle.packageDisplayName != null)
                                Text(
                                  vehicle.packageDisplayName!,
                                  style: const TextStyle(color: Colors.grey),
                                ),
                              if (fare != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Est. ₹${fare.finalPrice}',
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (fare.distance > 0)
                                  Text(
                                    '${fare.distance} km',
                                    style: const TextStyle(color: Colors.grey),
                                  ),
                              ],
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
                  color: Colors.black.withOpacity(0.1),
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

