import 'package:flutter/material.dart';
import '../api_client.dart';
import '../models/trip_models.dart';

class TripSummaryScreen extends StatefulWidget {
  const TripSummaryScreen({super.key, required this.trip, required this.token});

  final TripModel trip;
  final String token;

  @override
  State<TripSummaryScreen> createState() => _TripSummaryScreenState();
}

class _TripSummaryScreenState extends State<TripSummaryScreen> {
  TripModel? _trip;
  bool _loading = true;
  String? _error;
  final _api = ApiClient(baseUrl: kApiBaseUrl);

  @override
  void initState() {
    super.initState();
    _trip = widget.trip;
    _fetchTripSummary();
  }

  Future<void> _fetchTripSummary() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });

      final res = await _api.getTripSummary(
        token: widget.token,
        tripId: widget.trip.id,
      );

      if (res.success && res.body['data'] != null) {
        final responseData = Map<String, dynamic>.from(res.body['data']);
        
        // Extract tripDetails and tripSummary from nested structure
        final tripDetails = responseData['tripDetails'] as Map<String, dynamic>? ?? {};
        final tripSummary = responseData['tripSummary'] as Map<String, dynamic>? ?? {};
        final customerDetails = responseData['customerDetails'] as Map<String, dynamic>? ?? {};
        
        // Merge tripDetails and tripSummary into a single map for TripModel
        final mergedTripData = <String, dynamic>{
          ...tripDetails,
          ...tripSummary,
          // Ensure bookingId/tripId is present
          'bookingId': tripDetails['bookingId'] ?? widget.trip.id,
          'tripId': tripDetails['bookingId'] ?? widget.trip.id,
          // Map customer details
          'customerName': customerDetails['name'] ?? '',
          'customerPhone': customerDetails['phone'] ?? '',
          // Map distance from tripDetails or tripSummary
          'distance': tripDetails['distance'] ?? tripSummary['totalKm'] ?? tripDetails['tripCompletedDistance'],
          // Map fare from tripDetails or tripSummary
          'fare': tripDetails['finalAmount'] ?? tripSummary['finalAmount'] ?? tripDetails['tripCompletedFinalAmount'],
          // Map duration
          'duration': tripDetails['duration'] ?? tripSummary['duration'],
          // Map base rate (driver beta / vehicle base rate)
          'baseRatePerKm': tripDetails['pricePerKm'] ?? tripSummary['pricePerKm'],
          'vehicleBaseRate': tripDetails['driverBeta'] ?? tripDetails['tripCompletedDriverBeta'] ?? tripSummary['driverBeta'] ?? tripSummary['baseFare'],
          // Map extra charges from tripDetails or tripSummary
          'extraCharges': tripDetails['extraCharges'] ?? tripSummary['additionalCharges'] ?? {},
          // Map individual charges if available
          'hillCharge': tripDetails['extraHill'] ?? tripSummary['hillCharge'],
          'tollCharge': tripDetails['extraToll'] ?? tripSummary['tollCharge'],
          'permitCharge': tripDetails['extraPermitCharge'] ?? tripSummary['permitCharge'],
          // Status
          'status': tripDetails['status'] ?? tripDetails['paymentStatus'] ?? widget.trip.status,
        };
        
        // Debug: Print received data
        _log('[TripSummary] ========================================');
        _log('[TripSummary] Response keys: ${responseData.keys.toList()}');
        _log('[TripSummary] TripDetails keys: ${tripDetails.keys.toList()}');
        _log('[TripSummary] TripSummary keys: ${tripSummary.keys.toList()}');
        _log('[TripSummary] Merged trip data keys: ${mergedTripData.keys.toList()}');
        _log('[TripSummary] Booking ID: ${mergedTripData['bookingId']}');
        _log('[TripSummary] Distance: ${mergedTripData['distance']}');
        _log('[TripSummary] Fare: ${mergedTripData['fare']}');
        _log('[TripSummary] Pickup: ${mergedTripData['pickup']}');
        _log('[TripSummary] Drop: ${mergedTripData['drop']}');
        
        setState(() {
          _trip = TripModel.fromJson(mergedTripData);
          _loading = false;
        });
        
        _log('[TripSummary] Parsed trip ID: ${_trip?.id}');
        _log('[TripSummary] Parsed distance: ${_trip?.distance}');
        _log('[TripSummary] Parsed fare: ${_trip?.fare}');
        _log('[TripSummary] Parsed pickup: ${_trip?.pickup.address}');
        _log('[TripSummary] Parsed drop: ${_trip?.drop.address}');
        _log('[TripSummary] ========================================');
      } else {
        setState(() {
          _error = res.body['message'] ?? 'Failed to fetch trip summary';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Trip Summary'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _trip == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Trip Summary'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _error ?? 'Failed to load trip summary',
                style: const TextStyle(color: Colors.red),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchTripSummary,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final trip = _trip!;
    
    // Calculate fare components
    final double distance = trip.distance ?? 0.0;
    final double baseRate = trip.baseRatePerKm ?? 13.0;
    final double vehicleRate = trip.vehicleBaseRate ?? 300.0;
    final double baseFare = distance * baseRate;
    
    // Calculate total from breakdown (not the stored fare which may be different)
    final double hillCharge = trip.hillCharge ?? 0.0;
    final double tollCharge = trip.tollCharge ?? 0.0;
    final double petCharge = trip.petCharge ?? 0.0;
    final double permitCharge = trip.permitCharge ?? 0.0;
    final double parkingCharge = trip.parkingCharge ?? 0.0;
    final double waitingCharge = trip.waitingCharge ?? 0.0;
    
    final double totalFare = baseFare + vehicleRate + hillCharge + tollCharge + petCharge + permitCharge + parkingCharge + waitingCharge;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Summary'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Trip #${trip.id.length > 8 ? trip.id.substring(0, 8) : trip.id}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    trip.status.toUpperCase(),
                    style: TextStyle(
                      color: Colors.green.shade800,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Route
            _buildSectionTitle('Route Details'),
            const SizedBox(height: 12),
            _buildLocationRow(Icons.my_location, 'Pickup', trip.pickup.address),
            const SizedBox(height: 16),
            _buildLocationRow(Icons.location_on, 'Drop', trip.drop.address),
            const SizedBox(height: 24),

            // Stats
            _buildSectionTitle('Trip Stats'),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    Icons.speed,
                    'Distance',
                    '${distance.toStringAsFixed(1)} KM',
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildStatCard(
                    Icons.access_time,
                    'Duration',
                    _formatDuration(trip.duration),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Fare Breakdown
            _buildSectionTitle('Fare Breakdown'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  _buildFareRow('Base Rate (₹$baseRate/km)', '₹${baseFare.toStringAsFixed(2)}'),
                  const SizedBox(height: 8),
                  _buildFareRow('Driver Beta', '₹${vehicleRate.toStringAsFixed(2)}'),
                  const SizedBox(height: 8),
                  // Individual extra charges
                  if ((trip.hillCharge ?? 0) > 0) ...[
                    _buildFareRow('Hill Charge', '₹${trip.hillCharge!.toStringAsFixed(2)}'),
                    const SizedBox(height: 8),
                  ],
                  if ((trip.tollCharge ?? 0) > 0) ...[
                    _buildFareRow('Toll Charge', '₹${trip.tollCharge!.toStringAsFixed(2)}'),
                    const SizedBox(height: 8),
                  ],
                  if ((trip.petCharge ?? 0) > 0) ...[
                    _buildFareRow('Pet Charge', '₹${trip.petCharge!.toStringAsFixed(2)}'),
                    const SizedBox(height: 8),
                  ],
                  if ((trip.permitCharge ?? 0) > 0) ...[
                    _buildFareRow('Permit Charge', '₹${trip.permitCharge!.toStringAsFixed(2)}'),
                    const SizedBox(height: 8),
                  ],
                  if ((trip.parkingCharge ?? 0) > 0) ...[
                    _buildFareRow('Parking Charge', '₹${trip.parkingCharge!.toStringAsFixed(2)}'),
                    const SizedBox(height: 8),
                  ],
                  if ((trip.waitingCharge ?? 0) > 0) ...[
                    _buildFareRow('Waiting Charge', '₹${trip.waitingCharge!.toStringAsFixed(2)}'),
                    const SizedBox(height: 8),
                  ],
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Fare',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '₹${totalFare.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildLocationRow(IconData icon, String label, String address) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.blue, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                address.isEmpty ? 'Unknown Location' : address,
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.blue.shade700),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFareRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }

  String _formatDuration(int? durationMinutes) {
    if (durationMinutes == null || durationMinutes <= 0) {
      return 'N/A';
    }
    if (durationMinutes < 60) {
      return '$durationMinutes min';
    }
    final hours = durationMinutes ~/ 60;
    final minutes = durationMinutes % 60;
    if (minutes == 0) {
      return '${hours}h';
    }
    return '${hours}h ${minutes}min';
  }

  void _log(String message) {
    debugPrint(message);
  }
}
