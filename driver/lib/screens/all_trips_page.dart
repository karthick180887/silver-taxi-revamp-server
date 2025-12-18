import 'package:flutter/material.dart';
import '../api_client.dart';
import '../services/trip_service.dart';
import '../models/trip_models.dart';
import 'estimated_fare_screen.dart';
import 'start_trip_screen.dart';
import 'ongoing_trip_screen.dart';
import '../design_system.dart';

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
    // Check trip status to navigate to appropriate screen
    final status = trip.status.toLowerCase();
    
    // For Not-Started trips, go directly to Start Trip screen
    if (status == 'not-started' || status == 'not started' || status == 'accepted') {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => StartTripScreen(
            trip: trip,
            token: widget.token,
            tripService: _tripService,
          ),
        ),
      ).then((_) => _loadAllTrips());
      return;
    }
    
    // For Started trips, go to Ongoing Trip screen
    if (status == 'started') {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => OngoingTripScreen(
            trip: trip,
            token: widget.token,
            tripService: _tripService,
          ),
        ),
      ).then((_) => _loadAllTrips());
      return;
    }
    
    // Default: Navigate to Estimated Fare screen (for new bookings)
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
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.title, style: AppTextStyles.h2),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: RefreshIndicator(
        onRefresh: _loadAllTrips,
        color: AppColors.primary,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Error loading trips',
                          style: AppTextStyles.h3,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _error!,
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.error),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadAllTrips,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                          ),
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
                            const Icon(
                              Icons.directions_car_outlined,
                              size: 64,
                              color: AppColors.textTertiary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No trips available',
                              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textTertiary),
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
                          
                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 8,
                                  offset: Offset(0, 2),
                                )
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Service Type (red text at top)
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        serviceType,
                                        style: AppTextStyles.h3.copyWith(color: AppColors.primary),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: AppColors.primary.withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          'ID: $bookingId',
                                          style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                const Divider(),

                                const SizedBox(height: 8),
                                
                                // Vehicle Type
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.directions_car, size: 20, color: AppColors.textSecondary),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: RichText(
                                          text: TextSpan(
                                            style: AppTextStyles.bodyMedium,
                                            children: [
                                              const TextSpan(text: 'Vehicle Type: '),
                                              TextSpan(
                                                text: vehicleType,
                                                style: const TextStyle(
                                                  color: AppColors.primary,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                const SizedBox(height: 12),
                                
                                // From location
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.my_location, size: 20, color: Colors.green),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('From', style: AppTextStyles.label.copyWith(fontSize: 10)),
                                            Text(
                                              fromAddress,
                                              style: AppTextStyles.bodyMedium,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                const SizedBox(height: 12),
                                
                                // To location
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.location_on, size: 20, color: Colors.red),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('To', style: AppTextStyles.label.copyWith(fontSize: 10)),
                                            Text(
                                              toAddress,
                                              style: AppTextStyles.bodyMedium,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                const SizedBox(height: 12),
                                
                                // Pickup time
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.access_time, size: 20, color: AppColors.secondary),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: RichText(
                                          text: TextSpan(
                                            style: AppTextStyles.bodyMedium,
                                            children: [
                                              const TextSpan(text: 'Pickup time: '),
                                              TextSpan(
                                                text: pickupTimeStr,
                                                style: const TextStyle(
                                                  color: AppColors.primary,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                const SizedBox(height: 16),
                                
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
                                          color: AppColors.success,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          '₹${totalAmount.toStringAsFixed(0)}',
                                          style: AppTextStyles.h3.copyWith(color: Colors.white),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      // Action button (full width) - text depends on status
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
                                                  backgroundColor: AppColors.error,
                                                ),
                                              );
                                            }
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: _getButtonColor(trip),
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(vertical: 14),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            elevation: 0,
                                          ),
                                          child: Text(
                                            _getButtonText(trip),
                                            style: AppTextStyles.button,
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

  String _getButtonText(TripModel trip) {
    final status = trip.status.toLowerCase();
    if (status == 'not-started' || status == 'not started' || status == 'accepted') {
      return 'Start Trip';
    }
    if (status == 'started') {
      return 'View Ongoing Trip';
    }
    return 'View Details';
  }

  Color _getButtonColor(TripModel trip) {
    final status = trip.status.toLowerCase();
    if (status == 'not-started' || status == 'not started' || status == 'accepted') {
      return Colors.green;
    }
    if (status == 'started') {
      return Colors.orange;
    }
    return AppColors.primary;
  }
}
