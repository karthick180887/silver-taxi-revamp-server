import 'package:flutter/material.dart';
import '../models/trip_models.dart';
import '../services/trip_service.dart';
import '../api_client.dart';

class EstimatedFareScreen extends StatefulWidget {
  const EstimatedFareScreen({
    super.key,
    required this.trip,
    required this.token,
    required this.tripService,
  });

  final TripModel trip;
  final String token;
  final TripService tripService;

  @override
  State<EstimatedFareScreen> createState() => _EstimatedFareScreenState();
}

class _EstimatedFareScreenState extends State<EstimatedFareScreen> {
  bool _accepting = false;

  void _showConfirmDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text(
          'Confirm Booking',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to accept this booking?'),
            const SizedBox(height: 16),
            RichText(
              text: const TextSpan(
                style: TextStyle(color: Colors.black87, fontSize: 14),
                children: [
                  TextSpan(
                    text: 'Please note that if you cancel the trip, a cancellation penalty of ',
                  ),
                  TextSpan(
                    text: '₹500',
                    style: TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextSpan(
                    text: ' will be charged.',
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _acceptTrip();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Accept'),
          ),
        ],
      ),
    );
  }

  Future<void> _acceptTrip() async {
    setState(() => _accepting = true);
    try {
      await widget.tripService.acceptTrip(
        token: widget.token,
        tripId: widget.trip.id,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Trip accepted successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog(e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _accepting = false);
      }
    }
  }

  void _showErrorDialog(String errorMessage) {
    // Extract a user-friendly message
    String friendlyMessage = errorMessage;
    if (errorMessage.contains('already assigned')) {
      friendlyMessage = 'You are already assigned to another active booking. Please complete or cancel that booking first.';
    } else if (errorMessage.contains('Driver is already assigned')) {
      friendlyMessage = 'You are already assigned to another active booking. Please complete or cancel that booking first.';
    } else if (errorMessage.contains('not found')) {
      friendlyMessage = 'Booking not found. It may have been cancelled or assigned to another driver.';
    } else if (errorMessage.contains('inactive')) {
      friendlyMessage = 'Your driver account is inactive. Please contact admin for assistance.';
    }

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Unable to Accept',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            GestureDetector(
              onTap: () => Navigator.pop(ctx),
              child: Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  color: Colors.grey,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close,
                  size: 16,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              friendlyMessage,
              style: const TextStyle(fontSize: 14, color: Colors.black87),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('OK'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    final months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    final hour = date.hour;
    final minute = date.minute;
    final ampm = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '${date.day} ${months[date.month - 1]} ${date.year}, ${displayHour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')} $ampm';
  }

  String _formatDuration(int? minutes) {
    if (minutes == null) return 'N/A';
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    return '${hours.toString().padLeft(2, '0')} hours ${mins.toString().padLeft(2, '0')} min';
  }

  @override
  Widget build(BuildContext context) {
    final trip = widget.trip;
    final raw = trip.raw;
    
    // Extract data
    final bookingId = trip.id;
    final pickupDateTime = raw['pickupDateTime'] ?? raw['pickup_date_time'] ?? raw['pickupDate'];
    DateTime? pickupDate;
    if (pickupDateTime != null) {
      if (pickupDateTime is String) {
        pickupDate = DateTime.tryParse(pickupDateTime);
      } else if (pickupDateTime is int) {
        pickupDate = DateTime.fromMillisecondsSinceEpoch(pickupDateTime);
      }
    }
    
    final serviceType = raw['serviceType']?.toString() ?? 'One way';
    // Vehicle Type - check multiple sources
    final vehicleType = raw['vehicleType']?.toString() ?? 
                       (raw['vehicle'] is Map ? raw['vehicle']['name']?.toString() : null) ??
                       raw['vehicleName']?.toString() ??
                       'Not specified';
    final distance = trip.distance ?? _toDouble(raw['distance']) ?? 0.0;
    final minKm = _toDouble(raw['minKm']) ?? _toDouble(raw['minimumKm']) ?? 0.0;
    
    // Priority: API Distance > GPS > Odometer Diff > minKm (Smart Distance Logic)
    double displayDistance = distance;
    if (displayDistance <= 0.1) {
        if ((trip.gpsDistance ?? 0) > 0) {
          displayDistance = trip.gpsDistance!;
        } else if (trip.endOdometer != null && trip.startOdometer != null) {
          displayDistance = (trip.endOdometer! - trip.startOdometer!).clamp(0.0, double.infinity);
        } else if (minKm > 0) {
          // Fallback to minKm if no actual distance available
          displayDistance = minKm;
        }
    }

    // Don't use fallback - show actual rate from booking, 0 if missing
    final pricePerKm = trip.baseRatePerKm ?? _toDouble(raw['pricePerKm']) ?? 0.0;
    final permitCharge = trip.permitCharge ?? _toDouble(raw['permitCharge']) ?? 0.0;
    // Driver Beta can come from multiple fields
    final driverBeta = _toDouble(raw['tripCompletedDriverBeta']) ?? 
                       _toDouble(raw['driverBeta']) ?? 
                       _toDouble(raw['driver_beta']) ?? 
                       trip.vehicleBaseRate ?? 
                       0.0;
    final estimatedFare = trip.fare ?? _toDouble(raw['finalAmount']) ?? _toDouble(raw['estimatedAmount']) ?? 0.0;
    final duration = trip.duration;
    final paymentMethod = raw['paymentMethod']?.toString() ?? 'Cash';
    final status = trip.status;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Estimated Fare'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Trip ID Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Trip ID',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '#$bookingId',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (pickupDate != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Pickup Date & time: ${_formatDate(pickupDate)}',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Location Details Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Location Details',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // PICKUP
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: const BoxDecoration(
                            color: Colors.blue,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'PICKUP',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                trip.pickup.address,
                                style: const TextStyle(
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // DROP
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'DROP',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                trip.drop.address,
                                style: const TextStyle(
                                  fontSize: 14,
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
            ),
            
            const SizedBox(height: 16),
            
            // Estimated Fare Breakdown Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Estimated Fare Breakdown',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildFareRow('Service Type', serviceType),
                    const SizedBox(height: 8),
                    _buildFareRow('Vehicle Type', vehicleType),
                    const SizedBox(height: 12),
                    
                    // Distance Verification Section
                    if (trip.status.toLowerCase() == 'completed' && trip.endOdometer != null && trip.startOdometer != null) ...[
                      const Divider(),
                       Text(
                        'Distance Verification',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Odometer Distance
                      _buildFareRow(
                        'Odometer Distance', 
                        '${((trip.endOdometer ?? 0) - (trip.startOdometer ?? 0)).toStringAsFixed(1)} KM',
                        isSubItem: true
                      ),
                      // GPS Distance
                      if ((trip.gpsDistance ?? 0) > 0)
                        _buildFareRow(
                          'GPS Distance', 
                          '${(trip.gpsDistance ?? 0).toStringAsFixed(1)} KM',
                          isSubItem: true
                        ),
                      const SizedBox(height: 8),
                      // Breakdown Mismatch Warning (if applicable)
                      if ((trip.gpsDistance ?? 0) > 0 && 
                          ((((trip.endOdometer ?? 0) - (trip.startOdometer ?? 0)) - (trip.gpsDistance ?? 0)).abs() > 0.5))
                         Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.orange.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.warning_amber_rounded, size: 16, color: Colors.orange.shade800),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Distance Mismatch Detected. Using Odometer Reading.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.orange.shade900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      const Divider(),
                    ],

                    // Smart Distance Display
                    _buildFareRow('Total Distance', '${displayDistance.toStringAsFixed(1)} KM'),
                    const SizedBox(height: 12),
                    
                    _buildFareRow('Minimum KM', '${minKm.toStringAsFixed(0)} KM'),
                    const SizedBox(height: 12),
                    
                    // KM Rate Breakdown - Show actual rate from booking
                    () {
                      final hasActualRate = pricePerKm > 0;
                      final rate = hasActualRate ? pricePerKm : 0.0;
                      final billableKm = displayDistance > minKm ? displayDistance : minKm;
                      final distanceFare = billableKm * rate;
                      return Column(
                        children: [
                          _buildFareRow(
                            'Rate Per KM', 
                            hasActualRate ? '₹${rate.toStringAsFixed(0)}' : 'Not set',
                          ),
                          if (hasActualRate) ...[
                            const SizedBox(height: 8),
                            _buildFareRow(
                              'Distance Fare (${billableKm.toStringAsFixed(0)} KM × ₹${rate.toStringAsFixed(0)})', 
                              '₹${distanceFare.toStringAsFixed(0)}',
                              isSubItem: true
                            ),
                          ] else ...[
                            const SizedBox(height: 4),
                            Text(
                              '⚠️ Vehicle rate not saved in booking. Please check admin settings.',
                              style: TextStyle(fontSize: 12, color: Colors.orange.shade700),
                            ),
                          ],
                          const SizedBox(height: 12),
                        ],
                      );
                    }(),
                    
                    // Extra Charges - Always display all charges (even if 0)
                    _buildFareRow('Hill Charge', '₹${(trip.hillCharge ?? 0).toStringAsFixed(0)}'),
                    _buildFareRow('Toll Charge', '₹${(trip.tollCharge ?? 0).toStringAsFixed(0)}'),
                    _buildFareRow('Pet Charge', '₹${(trip.petCharge ?? 0).toStringAsFixed(0)}'),
                    _buildFareRow('Permit Charge', '₹${permitCharge.toStringAsFixed(0)}'),
                    _buildFareRow('Parking Charge', '₹${(trip.parkingCharge ?? 0).toStringAsFixed(0)}'),
                    _buildFareRow('Waiting Charge', '₹${(trip.waitingCharge ?? 0).toStringAsFixed(0)}'),
                    
                    const SizedBox(height: 12),

                    // Driver Beta / Vehicle Base Rate - always show with fallback
                    _buildFareRow('Driver Beta', '₹${((driverBeta > 0 ? driverBeta : (trip.vehicleBaseRate != null && trip.vehicleBaseRate! > 0 ? trip.vehicleBaseRate! : 300))).toStringAsFixed(0)}'),
                    const SizedBox(height: 12),
                    
                    // Tax & Convenience Fee
                    if (trip.tripCompletedTaxAmount != null && trip.tripCompletedTaxAmount! > 0)
                      _buildFareRow('Tax (GST)', '₹${trip.tripCompletedTaxAmount!.toStringAsFixed(0)}'),
                    if (trip.taxAmount != null && trip.taxAmount! > 0 && (trip.tripCompletedTaxAmount == null || trip.tripCompletedTaxAmount == 0))
                       _buildFareRow('Tax (GST)', '₹${trip.taxAmount!.toStringAsFixed(0)}'),
                    
                    if (trip.convenienceFee != null && trip.convenienceFee! > 0) ...[
                      const SizedBox(height: 8),
                      _buildFareRow('Convenience Fee', '₹${trip.convenienceFee!.toStringAsFixed(0)}'),
                    ],

                    // Discount & Advance
                    if (trip.discountAmount != null && trip.discountAmount! > 0) ...[
                      const SizedBox(height: 8),
                      _buildFareRow('Discount', '- ₹${trip.discountAmount!.toStringAsFixed(0)}', color: Colors.green),
                    ],
                    if (trip.advanceAmount != null && trip.advanceAmount! > 0) ...[
                      const SizedBox(height: 8),
                      _buildFareRow('Advance Paid', '- ₹${trip.advanceAmount!.toStringAsFixed(0)}', color: Colors.blue),
                    ],

                    const Divider(),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Estimated Fare',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '₹${estimatedFare.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Removed redundant Driver Beta and Estimated Fare Summary card
            
            const SizedBox(height: 16),
            
            // Trip Statistics Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Trip statistics',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatItem(Icons.straighten, 'Distance', '${distance.toStringAsFixed(1)}km'),
                        _buildStatItem(Icons.access_time, 'Duration', _formatDuration(duration)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Payment Mode'),
                        Text(
                          paymentMethod,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Status'),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              color: Colors.green.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Action Button - depends on trip status
            // "Booking Confirmed" -> Accept button
            // "Not-Started" -> Start button (navigate to ongoing trip)
            // Otherwise -> no button
            if (status.toLowerCase() == 'booking confirmed' || 
                status.toLowerCase() == 'booking-confirmed' ||
                status.toLowerCase() == 'new' ||
                status.toLowerCase() == 'pending') ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _accepting ? null : _showConfirmDialog,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _accepting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Accept Trip',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ] else if (status.toLowerCase() == 'not-started' || 
                       status.toLowerCase() == 'not started' ||
                       status.toLowerCase() == 'accepted') ...[
              // Already accepted - show "Start Trip" button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Navigate to ongoing trip screen to start the trip
                    Navigator.of(context).popUntil((route) => route.isFirst);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('This trip is already accepted. Go to "Not Started" to view and start it.'),
                        backgroundColor: Colors.blue,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'View Trip Details',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ] else ...[
              // Other statuses (Started, Completed, Cancelled) - show info
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Trip Status: $status',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black54,
                  ),
                ),
              ),
            ],
            
            const SizedBox(height: 16),
            
            // Support & Actions
            const Text(
              'Support & Actions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // TODO: Implement report issue
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Report Issue feature coming soon')),
                      );
                    },
                    icon: const Icon(Icons.warning_amber_rounded),
                    label: const Text('Report Issue'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // TODO: Implement call admin
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Call Admin feature coming soon')),
                      );
                    },
                    icon: const Icon(Icons.phone),
                    label: const Text('Call Admin'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFareRow(String label, String value, {bool isSubItem = false, Color? color}) {
    return Padding(
      padding: EdgeInsets.only(left: isSubItem ? 16.0 : 0.0, bottom: isSubItem ? 4.0 : 0.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isSubItem ? 13 : 14,
              color: color ?? (isSubItem ? Colors.grey.shade700 : Colors.black87),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isSubItem ? 13 : 14,
              fontWeight: isSubItem ? FontWeight.normal : FontWeight.w600,
              color: color ?? (isSubItem ? Colors.grey.shade700 : Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String label, String value) {
    return Column(
      children: [
        Icon(icon, size: 32, color: Colors.blue.shade700),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
}

