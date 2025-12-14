import 'package:flutter/material.dart';
import '../api_client.dart';
import '../services/trip_service.dart';
import '../models/trip_models.dart';
import 'estimated_fare_screen.dart';

class AllTripsPage extends StatefulWidget {
  const AllTripsPage({
    super.key,
    required this.token,
    this.status = 'Booking Confirmed',
    this.title = 'New Bookings',
  });

  final String token;
  final String status;
  final String title;

  @override
  State<AllTripsPage> createState() => _AllTripsPageState();
}

class _AllTripsPageState extends State<AllTripsPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  late final TripService _tripService = TripService(apiClient: _api);
  List<TripModel> _allTrips = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAllTrips();
  }

  Future<void> _loadAllTrips() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Fetch trips with provided status
      final result = await _tripService.getTripsByStatus(
        token: widget.token,
        status: widget.status,
      );

      if (mounted) {
        // Filter out any invalid trips that might cause parsing errors
        final validTrips = <TripModel>[];
        for (var i = 0; i < result.length; i++) {
          try {
            final trip = result[i];
            // Validate trip has required fields and is not null
            if (trip.id.isNotEmpty && 
                trip.pickup.address.isNotEmpty && 
                trip.drop.address.isNotEmpty) {
              validTrips.add(trip);
            } else {
              debugPrint('AllTripsPage: Skipping trip at index $i - missing required fields');
            }
          } catch (e, stackTrace) {
            debugPrint('AllTripsPage: Error processing trip at index $i: $e');
            debugPrint('AllTripsPage: Stack trace: $stackTrace');
            // Continue with next trip instead of crashing
          }
        }
        
        setState(() {
          _allTrips = validTrips;
          _loading = false;
        });
      }
    } catch (e, stackTrace) {
      debugPrint('AllTripsPage: Error loading trips: $e');
      debugPrint('AllTripsPage: Stack trace: $stackTrace');
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  void _onViewDetails(TripModel trip) {
    // Navigate to Estimated Fare screen (Step 2)
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => EstimatedFareScreen(
          trip: trip,
          token: widget.token,
          tripService: _tripService,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: RefreshIndicator(
        onRefresh: _loadAllTrips,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Error loading trips',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _error!,
                          style: TextStyle(color: Colors.red.shade600),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadAllTrips,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : _allTrips.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.directions_car_outlined,
                              size: 64,
                              color: Colors.grey.shade400,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No trips available',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _allTrips.length,
                        itemBuilder: (context, index) {
                          // Safety check for index bounds
                          if (index < 0 || index >= _allTrips.length) {
                            return const SizedBox.shrink();
                          }
                          
                          final trip = _allTrips[index];
                          
                          // Extract data from trip
                          final serviceType = trip.raw['serviceType']?.toString() ?? 'One way';
                          final bookingId = trip.id;
                          final vehicleType = trip.raw['vehicleType']?.toString() ?? 
                                            trip.raw['vehicle']?['name']?.toString() ?? 
                                            'Vehicle';
                          final fromAddress = trip.pickup.address;
                          final toAddress = trip.drop.address;
                          final pickupDateTime = trip.raw['pickupDateTime'] ?? 
                                               trip.raw['pickup_date_time'] ??
                                               trip.raw['pickupDate'];
                          final totalAmount = trip.fare ?? 
                                            _toDouble(trip.raw['finalAmount']) ??
                                            _toDouble(trip.raw['estimatedAmount']) ??
                                            0.0;
                          
                          // Format pickup date and time
                          String pickupTimeStr = 'N/A';
                          if (pickupDateTime != null) {
                            try {
                              if (pickupDateTime is String) {
                                final dt = DateTime.tryParse(pickupDateTime);
                                if (dt != null) {
                                  final yearStr = dt.year.toString();
                                  final shortYear = yearStr.length >= 2 ? yearStr.substring(yearStr.length - 2) : yearStr;
                                  final hour = dt.hour;
                                  final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
                                  final ampm = hour >= 12 ? 'PM' : 'AM';
                                  pickupTimeStr = '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/$shortYear (${displayHour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')} $ampm)';
                                }
                              } else if (pickupDateTime is int) {
                                final dt = DateTime.fromMillisecondsSinceEpoch(pickupDateTime);
                                final yearStr = dt.year.toString();
                                final shortYear = yearStr.length >= 2 ? yearStr.substring(yearStr.length - 2) : yearStr;
                                final hour = dt.hour;
                                final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
                                final ampm = hour >= 12 ? 'PM' : 'AM';
                                pickupTimeStr = '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/$shortYear (${displayHour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')} $ampm)';
                              }
                            } catch (e) {
                              debugPrint('Error parsing pickup date: $e');
                            }
                          }
                          
                          return Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Service Type (red text at top)
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                                  child: Text(
                                    serviceType,
                                    style: const TextStyle(
                                      color: Colors.red,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                
                                // Booking ID
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Text(
                                    '($bookingId)',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ),
                                
                                const SizedBox(height: 12),
                                
                                // Vehicle Type
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: RichText(
                                    text: TextSpan(
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.black87,
                                      ),
                                      children: [
                                        const TextSpan(text: 'Vehicle Type : '),
                                        TextSpan(
                                          text: vehicleType,
                                          style: const TextStyle(
                                            color: Colors.red,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                
                                const SizedBox(height: 8),
                                
                                // From location
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Text(
                                    'From : $fromAddress',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ),
                                
                                const SizedBox(height: 8),
                                
                                // To location
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Text(
                                    'To : $toAddress',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ),
                                
                                const SizedBox(height: 8),
                                
                                // Pickup time
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: RichText(
                                    text: TextSpan(
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.black87,
                                      ),
                                      children: [
                                        const TextSpan(text: 'Pickup time : '),
                                        TextSpan(
                                          text: pickupTimeStr,
                                          style: const TextStyle(
                                            color: Colors.red,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                
                                const SizedBox(height: 12),
                                
                                // Total Amount (green button aligned right) and View Details button
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      // Green amount button (aligned right)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                        decoration: BoxDecoration(
                                          color: Colors.green,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          '₹${totalAmount.toStringAsFixed(0)}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      // View Details button (full width)
                                      SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton(
                                          onPressed: () {
                                            try {
                                              _onViewDetails(trip);
                                            } catch (e) {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Error opening details: $e'),
                                                  backgroundColor: Colors.red,
                                                ),
                                              );
                                            }
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.blue,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(vertical: 14),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                          ),
                                          child: const Text(
                                            'View Details',
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                const SizedBox(height: 16),
                              ],
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) {
      return double.tryParse(value);
    }
    return null;
  }
}
