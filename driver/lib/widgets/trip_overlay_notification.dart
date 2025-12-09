import 'package:flutter/material.dart';
import '../models/trip_models.dart';
import '../services/trip_service.dart';

/// Overlay notification that appears on top of other apps
/// Similar to Uber Driver - shows trip details with action buttons
class TripOverlayNotification extends StatelessWidget {
  final TripModel trip;
  final String token;
  final TripService tripService;
  final VoidCallback? onAccept;
  final VoidCallback? onDismiss;

  const TripOverlayNotification({
    super.key,
    required this.trip,
    required this.token,
    required this.tripService,
    this.onAccept,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final pickupAddr = trip.pickup.address;
    final dropAddr = trip.drop.address;
    final fare = trip.fare ?? 0.0;

    return Material(
      color: Colors.transparent,
      child: Container(
        margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade900,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header with "Go Intercity" style button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade800,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.person, color: Colors.white70, size: 20),
                  const SizedBox(width: 8),
                  const Text(
                    'New Trip Request',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white70, size: 20),
                    onPressed: onDismiss,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),

            // Fare Information
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '₹${fare.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            '*Includes tax',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.green.shade700,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Cash payment',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Trip Summary
                  const Row(
                    children: [
                      Icon(Icons.access_time, color: Colors.white70, size: 16),
                      SizedBox(width: 8),
                      Text(
                        '30 mins (12.0 km) total',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Route Details
                  _buildLocationRow(
                    isPickup: true,
                    time: '9 min (1.5 km)',
                    address: pickupAddr,
                  ),
                  const SizedBox(height: 16),
                  _buildLocationRow(
                    isPickup: false,
                    address: dropAddr,
                  ),
                ],
              ),
            ),

            // Action Button
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade800,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: ElevatedButton(
                onPressed: onAccept,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2575FC),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Accept Trip',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationRow({
    required bool isPickup,
    required String address,
    String? time,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: isPickup ? Colors.green : Colors.red,
                shape: BoxShape.circle,
              ),
            ),
            if (isPickup)
              Container(
                width: 2,
                height: 40,
                color: Colors.grey.shade700,
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (time != null)
                Text(
                  time,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              if (time != null) const SizedBox(height: 4),
              Text(
                address,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

