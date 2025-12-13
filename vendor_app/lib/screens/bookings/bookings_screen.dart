import 'package:flutter/material.dart';
import '../../api_client.dart';
import '../../design_system.dart';
import 'package:shared_preferences/shared_preferences.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookings'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _tabs.map((status) => _BookingList(status: status)).toList(),
      ),
    );
  }
}

class _BookingList extends StatefulWidget {
  final String status;
  const _BookingList({required this.status});

  @override
  State<_BookingList> createState() => _BookingListState();
}

class _BookingListState extends State<_BookingList> {
  final _api = VendorApiClient();
  bool _isLoading = true;
  List<dynamic> _bookings = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
  }

  Future<void> _fetchBookings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('vendor_token');
      if (token == null) return;

      final res = await _api.getAllBookings(token: token); // TODO: Filter by status API side ideally
      // Note: The generic getAllBookings might return everything. 
      // API documentation says GET /vendor/bookings/specific with queryParams is better for filtering.
      
      if (res.statusCode == 200) {
        final allBookings = res.data as List<dynamic>;
        
        setState(() {
          if (widget.status == 'All') {
            _bookings = allBookings;
          } else {
             // Client side filtering for now if API doesn't support easy status query here
             // Or map status 'Pending' -> 'booking_pending' etc based on actual API values
             final statusLower = widget.status.toLowerCase();
             _bookings = allBookings.where((b) {
               final s = b['status']?.toString().toLowerCase() ?? '';
               return s.contains(statusLower);
             }).toList();
          }
           _isLoading = false;
        });
      } else {
        setState(() {
          _error = res.message;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(child: Text('Error: $_error', style: const TextStyle(color: AppColors.error)));
    }

    if (_bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.assignment_outlined, size: 48, color: AppColors.textLight),
            const SizedBox(height: 16),
            Text(
              'No ${widget.status} bookings',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _bookings.length,
      itemBuilder: (context, index) {
        final booking = _bookings[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(
              'Booking #${booking['bookingId'] ?? '...'}',
              style: AppTextStyles.label,
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(booking['pickupAddress'] ?? 'No pickup address'),
                const SizedBox(height: 2),
                const Icon(Icons.arrow_downward, size: 12, color: AppColors.textSecondary),
                const SizedBox(height: 2),
                Text(booking['dropoffAddress'] ?? 'No dropoff address'),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        booking['status'] ?? 'Unknown',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      booking['totalAmount'] != null ? '₹${booking['totalAmount']}' : '₹0',
                      style: AppTextStyles.label,
                    ),
                  ],
                ),
              ],
            ),
            trailing: const Icon(Icons.chevron_right, color: AppColors.textLight),
            onTap: () {
              // TODO: Navigate to BookingDetailScreen
            },
          ),
        );
      },
    );
  }
}
