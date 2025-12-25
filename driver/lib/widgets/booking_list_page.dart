import 'dart:async';

import 'package:flutter/material.dart';

import '../api_client.dart';
import '../models/trip_models.dart';
import '../services/socket_service.dart';
import '../services/trip_service.dart';
import '../screens/ongoing_trip_screen.dart';
import '../screens/start_trip_screen.dart';
import '../screens/trip_summary_screen.dart';

class BookingListPage extends StatefulWidget {
  const BookingListPage({
    super.key,
    required this.token,
    required this.status,
    this.showHeader = true,
    this.isLive = false,
    this.statusLabel,
    this.onRefreshCounts,
  });

  final String token;
  final String status;
  final bool showHeader;
  final bool isLive;
  final String? statusLabel;
  final VoidCallback? onRefreshCounts;

  @override
  State<BookingListPage> createState() => _BookingListPageState();
}

class _BookingListPageState extends State<BookingListPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  late final TripService _tripService = TripService(apiClient: _api);
  List<TripModel> _bookings = [];
  bool _loading = false;
  String? _error;
  StreamSubscription? _bookingSub;

  @override
  void initState() {
    super.initState();
    _loadBookings();
    _subscribeToSocket();
  }

  @override
  void didUpdateWidget(BookingListPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.status != widget.status || oldWidget.isLive != widget.isLive) {
      _loadBookings();
    }
  }

  @override
  void dispose() {
    _bookingSub?.cancel();
    super.dispose();
  }

  void _subscribeToSocket() {
    debugPrint('[BookingListPage] ========================================');
    debugPrint('[BookingListPage] 🔵 Setting up bookingUpdateStream listener');
    debugPrint('[BookingListPage] Tab status: ${widget.status}');
    debugPrint('[BookingListPage] Is Live: ${widget.isLive}');
    debugPrint('[BookingListPage] ========================================');
    
    _bookingSub = SocketService().bookingUpdateStream.listen((event) {
      debugPrint('[BookingListPage] ========================================');
      debugPrint('[BookingListPage] 📨📨📨 RECEIVED BOOKING UPDATE EVENT 📨📨📨');
      debugPrint('[BookingListPage] Full event: $event');
      debugPrint('[BookingListPage] Mounted: $mounted');
      debugPrint('[BookingListPage] ========================================');
      
      if (!mounted) {
        debugPrint('[BookingListPage] ⚠️ Widget not mounted, ignoring event');
        return;
      }
      
      final type = event['type']?.toString() ?? '';
      final data = event['data'];
      
      debugPrint('[BookingListPage] Event type: "$type"');
      debugPrint('[BookingListPage] Event data: $data');

      if (type == 'NEW_TRIP_OFFER' && widget.isLive) {
        // Optimistically insert without round-trip
        try {
          final trip = TripModel.fromJson(Map<String, dynamic>.from(data));
          setState(() {
            _bookings = [trip, ..._bookings];
          });
          widget.onRefreshCounts?.call();
        } catch (_) {
          _loadBookings();
        }
      } else if (type == 'TRIP_ACCEPTED') {
        // When a trip is accepted, refresh the "Not Started" tab
        // This handles trips accepted via overlay notification
        final tripId = (data is Map && data['tripId'] != null)
            ? data['tripId'].toString()
            : (data is Map && data['bookingId'] != null)
                ? data['bookingId'].toString()
                : '';
        
        debugPrint('[BookingListPage] ========================================');
        debugPrint('[BookingListPage] 🎯 TRIP_ACCEPTED received!');
        debugPrint('[BookingListPage] Trip ID: $tripId');
        debugPrint('[BookingListPage] Current tab status: ${widget.status}');
        debugPrint('[BookingListPage] Is Live tab: ${widget.isLive}');
        debugPrint('[BookingListPage] ========================================');
        
        // If we're on the "Not Started" tab, refresh to show the newly accepted trip
        if (widget.status == kTripStatusNotStarted || widget.status == 'not-started' || widget.status == 'accepted') {
          debugPrint('[BookingListPage] ✅ Refreshing "Not Started" tab after trip acceptance');
          _loadBookings();
          widget.onRefreshCounts?.call();
        } else if (widget.isLive) {
          // If on "New" tab, remove the accepted trip from the list
          if (tripId.isNotEmpty) {
            setState(() {
              _bookings = _bookings.where((b) => b.id != tripId).toList();
            });
          }
          widget.onRefreshCounts?.call();
        } else {
          // For other tabs, just refresh counts
          widget.onRefreshCounts?.call();
        }
      } else if (type == 'TRIP_CANCELLED') {
        final id = (data is Map && data['bookingId'] != null)
            ? data['bookingId'].toString()
            : data is Map && data['tripId'] != null
                ? data['tripId'].toString()
                : '';
        if (id.isNotEmpty) {
          setState(() {
            _bookings = _bookings.where((b) => b.id != id).toList();
          });
          widget.onRefreshCounts?.call();
        } else {
          _loadBookings();
        }
      } else if (type == 'TRIP_STARTED' || type == 'TRIP_COMPLETED' || type == 'TRIP_UPDATE') {
        // For any lifecycle change, trigger a reload to keep list fresh
        debugPrint('[BookingListPage] 🔄 Received lifecycle update ($type), reloading list...');
        _loadBookings();
        widget.onRefreshCounts?.call();
      } else if (type.isEmpty && widget.isLive) {
        // Legacy payload without type, still refresh the new tab.
        _loadBookings();
      }
    });
  }

  Future<void> _loadBookings() async {
    setState(() {
      _loading = true;
      _error = null;
      _bookings = [];
    });
    try {
      if (widget.isLive) {
        // getLiveTrips() handles booking fallback to match backend counts API
        // Backend counts API includes bookings when trip offers = 0
        debugPrint('[BookingListPage] 🔄 Loading live trips...');
        final live = await _tripService.getLiveTrips(widget.token);
        if (!mounted) return;
        debugPrint('[BookingListPage] ✅ Loaded ${live.offers.length} live trips');
        setState(() {
          // Show all bookings matching the conditions
          _bookings = live.offers;
        });
        return;
      }

      debugPrint('[BookingListPage] 🔄 Loading trips with status: ${widget.status}');
      final trips = await _tripService.getTripsByStatus(
        token: widget.token,
        status: widget.status,
      );
      if (mounted) {
        debugPrint('[BookingListPage] ========================================');
        debugPrint('[BookingListPage] 📊 Loaded trips for status: ${widget.status}');
        debugPrint('[BookingListPage]   - Status label: ${widget.statusLabel}');
        debugPrint('[BookingListPage]   - Trips found: ${trips.length}');
        debugPrint('[BookingListPage]   - Trip IDs: ${trips.map((t) => t.id).toList()}');
        debugPrint('[BookingListPage]   - Trip statuses: ${trips.map((t) => t.status).toList()}');
        debugPrint('[BookingListPage] ========================================');
        setState(() {
          // Show all bookings matching the conditions (no limit)
          _bookings = trips;
        });
        debugPrint('[BookingListPage] ✅ State updated: ${_bookings.length} trips in list');
      }
    } on Exception catch (e) {
      debugPrint('[BookingListPage] ❌ Error loading bookings: $e');
      if (mounted) {
        // Extract user-friendly error message
        String errorMessage = e.toString();
        if (errorMessage.contains('Network error')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (errorMessage.contains('timeout')) {
          errorMessage = 'Request timed out. The server is taking too long to respond. Please try again.';
        } else if (errorMessage.contains('Failed to fetch')) {
          errorMessage = 'Failed to load trips. Please check your connection and try again.';
        } else if (errorMessage.contains('401') || errorMessage.contains('Unauthorized')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (errorMessage.contains('500') || errorMessage.contains('Internal Server Error')) {
          errorMessage = 'Server error. Please try again later or contact support.';
        }
        
        setState(() {
          _error = errorMessage;
        });
      }
    } catch (e) {
      debugPrint('[BookingListPage] ❌ Unexpected error loading bookings: $e');
      if (mounted) {
        setState(() {
          _error = 'An unexpected error occurred. Please try again.';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _acceptTrip(String tripId) async {
    try {
      await _tripService.acceptTrip(token: widget.token, tripId: tripId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trip accepted!')),
        );
        _loadBookings();
        widget.onRefreshCounts?.call();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _startTrip(String tripId) {
    final trip = _bookings.firstWhere((b) => b.id == tripId);
    
    // CRITICAL: Check if this is a booking - bookings cannot be started
    // Check STATUS first, not just ID prefix
    // When a booking is accepted, it becomes a trip with status "accepted"
    // Even though the ID may still start with "booking-", it's now a trip
    final status = trip.status.toLowerCase();
    final isBooking = (status == 'booking confirmed' || 
                      status == 'booking_confirmed' || 
                      status == 'pending' ||
                      status == 'new' ||
                      status == 'offered') &&
                      status != 'accepted' &&
                      status != 'non-started' &&
                      status != 'not-started';
    
    if (isBooking) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cannot start a booking. Please accept the booking first to convert it to a trip.'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }
    
    // Also check using the helper function for consistency
    if (_isBookingId(tripId)) {
      _showBookingStartUnsupported();
      return;
    }
    
    // Show confirmation dialog before starting trip
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Start Trip'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Customer: ${trip.customerName}'),
            const SizedBox(height: 8),
            Text('From: ${trip.pickup.address}'),
            const SizedBox(height: 8),
            Text('To: ${trip.drop.address}'),
            const SizedBox(height: 16),
            const Text(
              'Make sure you have:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text('• Start Odometer reading'),
            const Text('• Customer Start OTP'),
            const SizedBox(height: 16),
            const Text(
              'Are you ready to start this trip?',
              style: TextStyle(fontWeight: FontWeight.w500),
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
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => StartTripScreen(
                    trip: trip,
                    token: widget.token,
                    tripService: _tripService,
                  ),
                ),
              ).then((_) {
                _loadBookings();
                widget.onRefreshCounts?.call();
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Start Trip'),
          ),
        ],
      ),
    );
  }

  void _navigateToOngoingTrip(TripModel trip) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OngoingTripScreen(
          trip: trip,
          token: widget.token,
          tripService: _tripService,
        ),
      ),
    ).then((_) {
      _loadBookings();
      widget.onRefreshCounts?.call();
    });
  }

  void _navigateToTripSummary(TripModel trip) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TripSummaryScreen(trip: trip, token: widget.token),
      ),
    );
  }

  // Check if a trip is actually a booking (not yet accepted/converted to trip)
  // Once accepted, bookings become trips with status "accepted", "non-started", etc.
  // IMPORTANT: When a booking is accepted, a trip is created with trip_id = booking_id
  // So the ID will still start with "booking-" but it's actually a trip now
  // We must check STATUS first, not just ID prefix
  bool _isBookingId(String id) {
    try {
      final trip = _bookings.firstWhere((b) => b.id == id);
      final status = trip.status.toLowerCase();
      
      // If status indicates it's a trip (accepted, started, etc.), it's NOT a booking
      // Even if the ID starts with "booking-", once it has trip status, it's a trip
      if (status == 'accepted' || 
          status == 'non-started' || 
          status == 'not-started' ||
          status == 'started' || 
          status == 'completed' || 
          status == 'cancelled') {
        return false; // It's a trip, not a booking
      }
      
      // Only these statuses indicate it's still a booking
      return status == 'booking confirmed' || 
             status == 'booking_confirmed' || 
             status == 'pending' ||
             status == 'new' ||
             status == 'offered';
    } catch (e) {
      // If trip not found in list, check by ID prefix as fallback
      // But this is less reliable since accepted trips can have booking- IDs
      return id.startsWith('booking-');
    }
  }

  void _showBookingStartUnsupported() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Start/OTP is not supported for admin bookings yet.'),
      ),
    );
  }

  String _getEmptyText() {
    final statusLower = widget.status.toLowerCase();
    if (widget.isLive || statusLower == 'pending' || statusLower == kTripStatusNew.toLowerCase()) {
      return 'No new requests';
    }
    if (statusLower == kTripStatusNotStarted.toLowerCase()) return 'No upcoming trips';
    if (statusLower == kTripStatusStarted.toLowerCase()) return 'No active trips';
    if (statusLower == kTripStatusCompleted.toLowerCase()) return 'No completed trips';
    if (statusLower == kTripStatusCancelled.toLowerCase()) return 'No cancelled trips';
    return 'No trips found';
  }

  String _statusLabel(TripModel trip) {
    if (trip.isNew) return 'New';
    if (trip.isNotStarted) return 'Not Started';
    if (trip.isStarted) return 'Started';
    if (trip.isCompleted) return 'Completed';
    if (trip.isCancelled) return 'Cancelled';
    return trip.status;
  }

  void _showBookingDetailsPopup(TripModel trip) {
    final isBooking = _isBookingId(trip.id);
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              
              // Header with status badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '${trip.serviceType} (${trip.id})',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor(trip).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _statusLabel(trip),
                      style: TextStyle(
                        color: _getStatusColor(trip),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 20),
              const Divider(),
              
              // Customer Info
              _buildDetailSection('Customer', [
                _buildDetailRow(Icons.person, 'Name', trip.customerName),
                if (trip.customerPhone.isNotEmpty)
                  _buildDetailRow(Icons.phone, 'Phone', trip.customerPhone),
              ]),
              
              const Divider(),
              
              // Location Info
              _buildDetailSection('Route', [
                _buildDetailRow(Icons.trip_origin, 'Pickup', trip.pickup.address, isGreen: true),
                _buildDetailRow(Icons.location_on, 'Drop', trip.drop.address, isRed: true),
                if (trip.distance != null && trip.distance! > 0)
                  _buildDetailRow(Icons.straighten, 'Distance', '${_formatDistance(trip.distance)} km'),
              ]),
              
              const Divider(),
              
              // Timing Info
              _buildDetailSection('Schedule', [
                _buildDetailRow(Icons.calendar_today, 'Date', _formatDate(trip.pickupDate)),
                _buildDetailRow(Icons.access_time, 'Time', trip.pickupTime),
              ]),
              
              const Divider(),
              
              // Fare Info
              _buildDetailSection('Fare Details', [
                _buildDetailRow(Icons.currency_rupee, 'Total Fare', '₹${_formatAmount(trip.fare)}'),
                if (trip.extraCharges != null && trip.extraCharges! > 0)
                  _buildDetailRow(Icons.add_circle_outline, 'Extra Charges', '₹${_formatAmount(trip.extraCharges)}'),
              ]),
              
              const SizedBox(height: 20),
              
              // Action Buttons
              if (trip.isNew)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _acceptTrip(trip.id);
                    },
                    icon: const Icon(Icons.check_circle),
                    label: const Text('Accept Trip'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              
              if (trip.isNotStarted)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: isBooking ? () {
                      Navigator.pop(ctx);
                      _showBookingStartUnsupported();
                    } : () {
                      Navigator.pop(ctx);
                      _startTrip(trip.id);
                    },
                    icon: const Icon(Icons.play_arrow),
                    label: const Text('Start Trip'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              
              if (trip.isStarted)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _navigateToOngoingTrip(trip);
                    },
                    icon: const Icon(Icons.directions_car),
                    label: const Text('View Ongoing Trip'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              
              if (trip.isCompleted)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _navigateToTripSummary(trip);
                    },
                    icon: const Icon(Icons.receipt_long),
                    label: const Text('View Summary'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.teal,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              
              const SizedBox(height: 10),
              
              // Close button
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(TripModel trip) {
    if (trip.isNew) return Colors.blue;
    if (trip.isNotStarted) return Colors.orange;
    if (trip.isStarted) return Colors.green;
    if (trip.isCompleted) return Colors.teal;
    if (trip.isCancelled) return Colors.red;
    return Colors.grey;
  }

  Widget _buildDetailSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 8),
        ...children,
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, {bool isGreen = false, bool isRed = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 20,
            color: isGreen ? Colors.green : isRed ? Colors.red : Colors.grey.shade600,
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? date) {
    if (date == null || date.isEmpty) return 'N/A';
    try {
      final parsed = DateTime.parse(date);
      return '${parsed.day} ${_monthName(parsed.month)} ${parsed.year}';
    } catch (_) {
      return date;
    }
  }

  String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }

  String _formatAmount(double? amount) {
    if (amount == null) return '0';
    if (amount == amount.roundToDouble()) {
      return amount.toStringAsFixed(0);
    }
    return amount.toStringAsFixed(2);
  }

  String? _formatDistance(double? distance) {
    if (distance == null) return null;
    if (distance == distance.roundToDouble()) {
      return distance.toStringAsFixed(0);
    }
    return distance.toStringAsFixed(1);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.showHeader) {
      return Scaffold(
        appBar: AppBar(title: Text('Bookings: ${widget.statusLabel ?? widget.status}')),
        body: _buildBody(),
      );
    }
    return _buildBody();
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red.shade400,
              ),
              const SizedBox(height: 16),
              Text(
                'Error Loading Trips',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.red.shade700,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadBookings,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.no_luggage_outlined, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              _getEmptyText(),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Pull down to refresh',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadBookings,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _bookings.length,
        itemBuilder: (ctx, i) {
          final item = _bookings[i];
          final fromAddr = item.pickup.address.isEmpty ? '?' : item.pickup.address;
          final toAddr = item.drop.address.isEmpty ? '?' : item.drop.address;
          final customerName = item.customerName;
          final tripId = item.id;
          final isBooking = _isBookingId(tripId);
          final amount = _formatAmount(item.fare);
          final distance = _formatDistance(item.distance);
          final displayStatus = _statusLabel(item);

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () => _showBookingDetailsPopup(item),
              borderRadius: BorderRadius.circular(12),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const CircleAvatar(child: Icon(Icons.person)),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                customerName,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'From: $fromAddr\nTo: $toAddr',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'Rs $amount',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            if (distance != null)
                              Text(
                                '$distance km',
                                style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                              ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                displayStatus,
                                style: TextStyle(
                                  color: Colors.grey.shade800,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (item.isNew || item.isNotStarted || item.isStarted)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (item.isNew)
                            ElevatedButton(
                              onPressed: () => _acceptTrip(tripId),
                              child: const Text('Accept'),
                            ),
                          if (item.isNotStarted)
                            ElevatedButton(
                              onPressed: isBooking ? _showBookingStartUnsupported : () => _startTrip(tripId),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Start Trip'),
                            ),
                          if (item.isStarted)
                            ElevatedButton(
                              onPressed: () => _navigateToOngoingTrip(item),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('End Trip'),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
