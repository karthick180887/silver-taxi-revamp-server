import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';
import '../design_system.dart';

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({
    super.key, 
    required this.token, 
    required this.adminId, 
    required this.customerId
  });

  final String token;
  final String adminId;
  final String customerId;

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  
  List<dynamic> _upcomingBookings = [];
  List<dynamic> _completedBookings = [];
  List<dynamic> _cancelledBookings = [];
  
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchAllBookings();
  }

  Future<void> _fetchAllBookings() async {
    setState(() => _isLoading = true);
    try {
      // Fetch Upcoming
      final upcomingRes = await _apiClient.getSpecificBookings(
        token: widget.token,
        status: 'upcoming',
      );
      
      // Fetch Completed
      final completedRes = await _apiClient.getSpecificBookings(
        token: widget.token,
        status: 'completed',
      );

       // Fetch Cancelled
      final cancelledRes = await _apiClient.getSpecificBookings(
        token: widget.token,
        status: 'cancelled',
      );

      if (mounted) {
        setState(() {
          if (upcomingRes.success && upcomingRes.body['data'] != null) {
            _upcomingBookings = upcomingRes.body['data'] as List;
          }
          if (completedRes.success && completedRes.body['data'] != null) {
            _completedBookings = completedRes.body['data'] as List;
          }
          if (cancelledRes.success && cancelledRes.body['data'] != null) {
             _cancelledBookings = cancelledRes.body['data'] as List;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching booking history: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Booking History', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF0A1E3C), // Dark Blue
        iconTheme: const IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFFFFD700), // Yellow
          unselectedLabelColor: Colors.white70,
          indicatorColor: const Color(0xFFFFD700),
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Completed'),
            Tab(text: 'Cancelled'),
          ],
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : TabBarView(
            controller: _tabController,
            children: [
              _buildBookingList(_upcomingBookings),
              _buildBookingList(_completedBookings),
              _buildBookingList(_cancelledBookings),
            ],
          ),
    );
  }

  Widget _buildBookingList(List<dynamic> bookings) {
    if (bookings.isEmpty) {
      return const Center(child: Text('No bookings found'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      itemBuilder: (context, index) {
        final booking = bookings[index];
        return _buildBookingCard(booking);
      },
    );
  }

  Widget _buildBookingCard(Map<String, dynamic> booking) {
    final pickup = booking['pickup'] is Map ? booking['pickup']['address'] : booking['pickup'];
    final drop = booking['drop'] is Map ? booking['drop']['address'] : booking['drop'];
    final bookingId = booking['bookingId'] ?? '';
    final serviceType = booking['serviceType'] ?? '';
    final date = booking['pickupDateTime'];
    final status = booking['status'] ?? 'Unknown';
    final amount = booking['finalAmount'] ?? 0;
    
    String formattedDate = '';
    if (date != null) {
      try {
        formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.parse(date));
      } catch (e) {
        formattedDate = date.toString();
      }
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    '$serviceType ($bookingId)',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.circle, color: Colors.green, size: 12),
                const SizedBox(width: 8),
                Expanded(child: Text(pickup ?? 'N/A', maxLines: 1, overflow: TextOverflow.ellipsis)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.circle, color: Colors.red, size: 12),
                const SizedBox(width: 8),
                Expanded(child: Text(drop ?? 'N/A', maxLines: 1, overflow: TextOverflow.ellipsis)),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(formattedDate, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                Text(
                  '₹$amount',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed': return Colors.green;
      case 'cancelled': return Colors.red;
      case 'booking confirmed': return Colors.blue;
      case 'not-started': return Colors.blueAccent;
      case 'started': return Colors.orange;
      default: return Colors.grey;
    }
  }
}
