import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../design_system.dart';
import 'booking_flow_screen.dart';
import '../widgets/app_drawer.dart';
import 'notifications_screen.dart';
import '../api_client.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.token});
  final String token;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  String? _customerName;
  String? _customerPhone;
  
  final TextEditingController _pickupController = TextEditingController();
  final TextEditingController _dropController = TextEditingController();
  final TextEditingController _dateController = TextEditingController();

  Map<String, dynamic>? _recentBooking;
  List<dynamic> _offers = [];
  bool _isLoadingOffers = true;
  bool _isLoadingBooking = true;
  String _adminId = 'admin-1';
  String? _customerId;

  @override
  void initState() {
    super.initState();
    _loadData();
    // Default date placeholder
    _dateController.text = DateFormat('dd-MM-yyyy, HH:mm').format(DateTime.now());
  }

  Future<void> _loadData() async {
    await _loadCustomerDetails();
    _fetchRecentBooking();
    _fetchOffersAndPromos();
  }

  Future<void> _loadCustomerDetails() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _customerName = prefs.getString('customer_name') ?? 'Rider';
      _customerPhone = prefs.getString('customer_phone') ?? ''; 
    });

    try {
      final result = await _apiClient.getCustomerDetails(token: widget.token);
      if (result.success && result.body['data'] != null) {
        final data = result.body['data'];
        setState(() {
          _customerId = data['customerId'];
          _customerName = data['name'];
          _customerPhone = data['phone'];
          if (data['adminId'] != null) _adminId = data['adminId'];
        });
        // Update prefs
        await prefs.setString('customer_name', _customerName!);
        if (_customerPhone != null) await prefs.setString('customer_phone', _customerPhone!);
        if (_customerId != null) await prefs.setString('customer_id', _customerId!);
      }
    } catch (e) {
      debugPrint('Error loading customer details: $e');
    }
  }

  Future<void> _fetchRecentBooking() async {
    try {
      final result = await _apiClient.getSpecificBookings(
        token: widget.token,
        status: 'recent',
      );
      if (mounted && result.success && result.body['data'] != null) {
        setState(() {
          _recentBooking = result.body['data'];
          _isLoadingBooking = false;
        });
      } else {
        setState(() => _isLoadingBooking = false);
      }
    } catch (e) {
      debugPrint('Error fetching recent booking: $e');
      if (mounted) setState(() => _isLoadingBooking = false);
    }
  }

  Future<void> _fetchOffersAndPromos() async {
    if (_customerId == null) return;
    try {
      final offersResult = await _apiClient.getAllOffers(
        token: widget.token,
        adminId: _adminId,
        customerId: _customerId!,
      );
      
      final promoResult = await _apiClient.getPromoCodes(
        token: widget.token,
        adminId: _adminId,
        customerId: _customerId!,
      );

      final List<dynamic> mergedList = [];

      if (mounted && offersResult.success && offersResult.body['data'] != null) {
        mergedList.addAll(offersResult.body['data'] as List);
      }
      
      if (mounted && promoResult.success && promoResult.body['data'] != null) {
        mergedList.addAll(promoResult.body['data'] as List);
      }

      if (mounted) {
        setState(() {
          _offers = mergedList;
          _isLoadingOffers = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching offers/promos: $e');
      if (mounted) setState(() => _isLoadingOffers = false);
    }
  }

  void _navigateToBooking() {
     Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BookingFlowScreen(token: widget.token),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A1E3C), // Dark Blue
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.amber, size: 28),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications, color: Colors.amber, size: 28),
            onPressed: () {
              Navigator.push(
                context, 
                MaterialPageRoute(builder: (_) => NotificationsScreen(
                  token: widget.token, 
                  customerId: _customerId, 
                  adminId: _adminId
                )),
              );
            },
          ),
        ],
      ),
      drawer: AppDrawer(
        customerName: _customerName ?? 'Rider',
        phone: _customerPhone,
        token: widget.token,
        customerId: _customerId ?? '',
        adminId: _adminId,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Dark Header Extension
            Container(
              width: double.infinity,
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 24),
              color: const Color(0xFF0A1E3C),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 10),
                  // Pickup
                  _buildLocationInput(
                    iconColor: Colors.green,
                    hint: 'Select your Pickup Location',
                    controller: _pickupController,
                    isPickup: true,
                  ),
                  const SizedBox(height: 12),
                  // Drop-off
                  const Text('Drop-off', style: TextStyle(color: Colors.white, fontSize: 14)),
                  const SizedBox(height: 6),
                  _buildLocationInput(
                    iconColor: Colors.red,
                    hint: 'Select your Drop Location',
                    controller: _dropController,
                    isDrop: true,
                  ),
                   const SizedBox(height: 12),
                  // Date
                  const Text('Date of Journey', style: TextStyle(color: Colors.white, fontSize: 14)),
                   const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: TextField(
                      controller: _dateController,
                      decoration: const InputDecoration(
                        icon: Icon(Icons.calendar_today_outlined, color: Colors.grey),
                        border: InputBorder.none,
                        hintText: 'DD-MM-YYYY, HH:MM',
                      ),
                      readOnly: true,
                      onTap: () {
                        // Date picker logic would go here
                      },
                    ),
                  ),
                   const SizedBox(height: 24),
                  // Search Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _navigateToBooking,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFFD700), // Yellow
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search, color: Colors.black),
                          SizedBox(width: 8),
                          Text(
                            'Search',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Recent Booking Section
            if (!_isLoadingBooking && _recentBooking != null)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                   Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSectionHeader('Recent Booking', Icons.history),
                      TextButton(onPressed: (){}, child: const Text('View All')),
                    ],
                  ),
                  _buildRecentBookingCard(),
                ],
              ),
            ),

            // Offers Section
            if (!_isLoadingOffers && _offers.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                       _buildSectionHeader('Offers', Icons.card_giftcard),
                       TextButton(onPressed: (){}, child: const Text('View All')),
                    ],
                  ),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _offers.map((offer) => Padding(
                        padding: const EdgeInsets.only(right: 12.0),
                        child: _buildOfferCard(offer),
                      )).toList(),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return  Row(
      children: [
        Icon(icon, color: Colors.amber, size: 20),
        const SizedBox(width: 8),
        Text(
          title, 
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
        ),
      ],
    );
  }

  Widget _buildLocationInput({
    required Color iconColor,
    required String hint,
    required TextEditingController controller,
    bool isPickup = false, 
    bool isDrop = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: iconColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: hint,
                border: InputBorder.none,
                hintStyle: TextStyle(color: Colors.grey[400]),
              ),
              onTap: _navigateToBooking, // Redirect to booking flow on tap
              readOnly: true,
            ),
          ),
          if (isPickup)
            const Icon(Icons.swap_vert, color: Colors.grey),
          if (isDrop)
             const Icon(Icons.add, color: Colors.black),
        ],
      ),
    );
  }

  Widget _buildRecentBookingCard() {
    if (_recentBooking == null) return const SizedBox.shrink();
    
    final pickup = _recentBooking!['pickup'] is Map 
        ? _recentBooking!['pickup']['address'] 
        : _recentBooking!['pickup'];
    final drop = _recentBooking!['drop'] is Map 
        ? _recentBooking!['drop']['address'] 
        : _recentBooking!['drop'];
    final bookingId = _recentBooking!['bookingId'] ?? '';
    final serviceType = _recentBooking!['serviceType'] ?? 'One way';
    final date = _recentBooking!['pickupDateTime'];
    final status = _recentBooking!['status'] ?? 'Unknown';
    final amount = _recentBooking!['finalAmount'] ?? 0;

    String formattedDate = '';
    if (date != null) {
      try {
        formattedDate = DateFormat('dd/MM/yyyy at HH:mm').format(DateTime.parse(date));
      } catch (e) {
        formattedDate = date.toString();
      }
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$serviceType ($bookingId)', 
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                // Place car image here if available, else icon
                 Image.network(
                  'https://www.toyota.co.in/images/showroom/corolla-altis/exterior/color/white-pearl-crystal-shine.png', // Placeholder
                  width: 80,
                  errorBuilder: (_,__,___) => const Icon(Icons.directions_car, size: 40),
                ),
              ],
            ),
            const SizedBox(height: 8),
             Row(
               children: [
                 const Icon(Icons.circle, color: Colors.green, size: 12),
                 const SizedBox(width: 8),
                 Expanded(child: Text(pickup ?? '', style: TextStyle(color: Colors.grey[800]), overflow: TextOverflow.ellipsis)),
               ],
             ),
             const SizedBox(height: 4),
              Row(
               children: [
                 const Icon(Icons.circle, color: Colors.red, size: 12),
                 const SizedBox(width: 8),
                 Expanded(child: Text(drop ?? '', style: TextStyle(color: Colors.grey[800]), overflow: TextOverflow.ellipsis)),
               ],
             ),
            const SizedBox(height: 12),
             Row(
              children: [
                Text('Trip Starts at, $formattedDate', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(status, style: TextStyle(color: Colors.grey[500], fontStyle: FontStyle.italic)),
              ],
            ),
             const SizedBox(height: 4),
             Row(
              children: [
                Text('₹$amount', style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 18)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfferCard(Map<String, dynamic> item) {
    // Determine if it's an Offer or Promo Code
    final title = item['code'] ?? item['offerName'] ?? 'OFFER';
    final desc = item['description'] ?? 'Discount';
    final isPromo = item.containsKey('code');
    final bannerImage = item['bannerImage'];

    return Container(
      width: 160,
      height: 120,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Background Image or Color
            Positioned.fill(
              child: bannerImage != null && bannerImage.toString().isNotEmpty
                  ? Image.network(
                      bannerImage,
                      fit: BoxFit.cover,
                      errorBuilder: (ctx, error, stackTrace) {
                        return Container(color: isPromo ? Colors.orange[50] : Colors.green[50]);
                      },
                    )
                  : Container(color: isPromo ? Colors.orange[50] : Colors.green[50]),
            ),
            
            // Content Overlay (if image exists, maximize contrast)
            if (bannerImage != null && bannerImage.toString().isNotEmpty)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.1),
                        Colors.black.withOpacity(0.7),
                      ],
                    ),
                  ),
                ),
              ),

            // Text Content
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title, 
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16, 
                        fontWeight: FontWeight.bold, 
                        color: (bannerImage != null && bannerImage.toString().isNotEmpty) 
                            ? Colors.white 
                            : (isPromo ? Colors.orange[800] : Colors.green[800])
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      desc, 
                      textAlign: TextAlign.center, 
                      style: TextStyle(
                        fontSize: 12, 
                        color: (bannerImage != null && bannerImage.toString().isNotEmpty) 
                            ? Colors.white.withOpacity(0.9) 
                            : (isPromo ? Colors.orange[900] : Colors.green[900])
                      ), 
                      maxLines: 3, 
                      overflow: TextOverflow.ellipsis
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDestinationChip(String label, String count) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
         decoration: BoxDecoration(
          color: const Color(0xFFFFD700), // Yellow
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
            // Text(count, style: const TextStyle(fontSize: 12)), // Optionally show count if desired
          ],
        ),
      ),
    );
  }
}
