import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../design_system.dart';
import 'booking_flow_screen.dart';
import '../widgets/inline_location_search.dart';
import 'vehicle_selection_screen.dart';
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
  
  Map<String, dynamic>? _pickupLocation;
  Map<String, dynamic>? _dropLocation;
  DateTime? _pickupDateTime;
  
  List<dynamic> _services = [];
  Map<String, dynamic>? _selectedService;
  bool _isLoadingServices = true;
  String _googleMapsKey = '';

  Map<String, dynamic>? _recentBooking;
  List<dynamic> _offers = [];
  bool _isLoadingOffers = true;
  bool _isLoadingBooking = true;
  String _adminId = 'admin-1';
  String? _customerId;

  @override
  void initState() {
    super.initState();
    _pickupDateTime = DateTime.now().add(const Duration(minutes: 15));
    _loadData();
  }

  Future<void> _loadData() async {
    await _loadCustomerDetails();
    _fetchServices(); 
    _fetchGoogleMapsKey();
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

  Future<void> _fetchGoogleMapsKey() async {
    try {
      final result = await _apiClient.getConfigKeys(
        token: widget.token,
        adminId: _adminId,
      );
      if (mounted && result.success && result.body['data'] != null) {
        final key = result.body['data']['google_maps_key'] ?? '';
        setState(() {
          _googleMapsKey = key;
        });
      }
    } catch (e) {
      debugPrint('Error fetching keys: $e');
    }
  }

  Future<void> _fetchServices() async {
    try {
      final result = await _apiClient.getServices(
        token: widget.token,
        adminId: _adminId, 
      );
      
      if (mounted) {
        setState(() {
          _isLoadingServices = false;
            if (result.success && result.body['data'] != null) {
            final allServices = result.body['data'] as List;
            // Filter out Hourly Packages as per requirement
            _services = allServices.where((s) {
              final name = s['name'].toString().toLowerCase();
              return !name.contains('hourly') && !name.contains('package');
            }).toList();
            
            if (_services.isNotEmpty) {
              _selectedService = _services[0];
            }
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingServices = false);
      }
    }
  }

  Future<void> _selectDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _pickupDateTime ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (date != null && mounted) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_pickupDateTime ?? DateTime.now()),
        builder: (context, child) {
           return Theme(
            data: Theme.of(context).copyWith(
              colorScheme: ColorScheme.light(
                primary: AppColors.primary,
                onPrimary: Colors.white,
                onSurface: AppColors.textPrimary,
              ),
            ),
            child: child!,
          );
        },
      );

      if (time != null && mounted) {
        setState(() {
          _pickupDateTime = DateTime(
            date.year, date.month, date.day, time.hour, time.minute,
          );
        });
      }
    }
  }

  void _proceedToBooking() {
     if (_pickupLocation == null || _dropLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select pickup and drop locations')),
      );
      return;
    }

    if (_selectedService == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a service type')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => VehicleSelectionScreen(
          token: widget.token,
          pickupLocation: _pickupLocation!,
          dropLocation: _dropLocation!,
          pickupDateTime: _pickupDateTime!,
          tripType: _selectedService!['name'], 
          serviceId: _selectedService!['serviceId'],
          phone: _customerPhone,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: AppColors.secondary, size: 28),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Text(
          'Silver Taxi',
          style: AppTextStyles.h3.copyWith(color: Colors.white),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: AppColors.secondary, size: 28),
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
            // Plan Your Ride - Main Card
            Container(
              decoration: const BoxDecoration(
                 color: AppColors.primary,
                 borderRadius: BorderRadius.only(
                   bottomLeft: Radius.circular(32),
                   bottomRight: Radius.circular(32),
                 ),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  
                  // Service Type Selector
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.surface.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: _services.map((service) {
                          final isSelected = _selectedService == service;
                          return Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _selectedService = service),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: isSelected ? AppColors.secondary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                  boxShadow: isSelected ? [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.1),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    )
                                  ] : null,
                                ),
                                child: Text(
                                  service['name'] ?? '',
                                  textAlign: TextAlign.center,
                                  style: AppTextStyles.label.copyWith(
                                    color: isSelected ? AppColors.primary : Colors.white.withOpacity(0.8),
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  
                  // Booking Card
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                           BoxShadow(
                             color: Colors.black.withOpacity(0.1),
                             blurRadius: 20,
                             offset: const Offset(0, 10),
                           ),
                        ],
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // -----------------------------------------------------------------
                          // Timeline Location Inputs (Enhanced)
                          // -----------------------------------------------------------------
                          // -----------------------------------------------------------------
                          // Timeline Location Inputs (Enhanced)
                          // -----------------------------------------------------------------
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border.withOpacity(0.5)),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                            child: Column(
                              children: [
                                // PICKUP SECTION
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                     Column(
                                       mainAxisSize: MainAxisSize.min,
                                       children: [
                                         const Icon(Icons.my_location_rounded, color: AppColors.success, size: 22),
                                         Container(
                                           height: 30,
                                           width: 2,
                                           margin: const EdgeInsets.symmetric(vertical: 4),
                                           decoration: BoxDecoration(
                                             gradient: LinearGradient(
                                               begin: Alignment.topCenter,
                                               end: Alignment.bottomCenter,
                                               colors: [AppColors.success.withOpacity(0.5), AppColors.error.withOpacity(0.5)],
                                             ),
                                           ),
                                         ),
                                       ],
                                     ),
                                     const SizedBox(width: 16),
                                     Expanded(
                                       child: Column(
                                         crossAxisAlignment: CrossAxisAlignment.start,
                                         children: [
                                           Text('PICKUP LOCATION', style: AppTextStyles.label.copyWith(fontSize: 12, color: AppColors.textTertiary, fontWeight: FontWeight.bold)),
                                           const SizedBox(height: 4),
                                           InlineLocationSearch(
                                             label: 'Current Location',
                                             icon: null, // Icon handled in timeline
                                             iconColor: Colors.transparent, 
                                             googleMapsKey: _googleMapsKey,
                                             initialAddress: _pickupLocation?['address'],
                                             onLocationSelected: (loc) => setState(() => _pickupLocation = loc),
                                           ),
                                           const Divider(height: 16),
                                         ],
                                       ),
                                     ),
                                  ],
                                ),
                                
                                // DROP SECTION
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                     const Column(
                                       children: [
                                          Icon(Icons.location_on_rounded, color: AppColors.error, size: 24),
                                             SizedBox(height: 18), // Visual balance
                                       ],
                                     ),
                                     const SizedBox(width: 16),
                                     Expanded(
                                       child: Column(
                                         crossAxisAlignment: CrossAxisAlignment.start,
                                         children: [
                                           Text('DROP OFF LOCATION', style: AppTextStyles.label.copyWith(fontSize: 12, color: AppColors.textTertiary, fontWeight: FontWeight.bold)),
                                           const SizedBox(height: 4),
                                           InlineLocationSearch(
                                             label: 'Where to?',
                                             icon: null,
                                             iconColor: Colors.transparent,
                                             googleMapsKey: _googleMapsKey,
                                             initialAddress: _dropLocation?['address'],
                                             onLocationSelected: (loc) => setState(() => _dropLocation = loc),
                                           ),
                                         ],
                                       ),
                                     ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          
                          const SizedBox(height: 20),
                          
                          // Date Picker
                          InkWell(
                             onTap: _selectDateTime,
                             borderRadius: BorderRadius.circular(16),
                             child: Container(
                               padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                               decoration: BoxDecoration(
                                 color: AppColors.background,
                                 borderRadius: BorderRadius.circular(16),
                                 border: Border.all(color: AppColors.border),
                               ),
                               child: Row(
                                 children: [
                                   const Icon(Icons.calendar_today_rounded, color: AppColors.secondary, size: 20),
                                   const SizedBox(width: 12),
                                   Expanded(
                                     child: Text(
                                       _pickupDateTime != null
                                           ? DateFormat('EEE, d MMM • h:mm a').format(_pickupDateTime!)
                                           : 'Select Date & Time',
                                       style: AppTextStyles.bodyLarge,
                                     ),
                                   ),
                                   Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textTertiary, size: 16),
                                 ],
                               ),
                             ),
                          ),
       
                          const SizedBox(height: 24),
                          
                          // Find Ride Button
                          SizedBox(
                            height: 56,
                            child: ElevatedButton(
                              onPressed: _proceedToBooking,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.secondary, // Gold/Yellow
                                foregroundColor: AppColors.primary,   // Dark Text
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: Text(
                                'Find Ride',
                                style: AppTextStyles.button.copyWith(
                                  color: AppColors.primary,
                                  fontSize: 18,
                                ),
                              ),
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
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                   Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSectionHeader('Recent Trip', Icons.history_rounded),
                      TextButton(onPressed: (){}, child: const Text('View All')),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildRecentBookingCard(),
                ],
              ),
            ),

            // Offers Section
            if (!_isLoadingOffers && _offers.isNotEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                       _buildSectionHeader('Exclusive Offers', Icons.local_offer_rounded),
                       TextButton(onPressed: (){}, child: const Text('View All')),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 140, // Height constraint for horizontal list
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    scrollDirection: Axis.horizontal,
                    itemCount: _offers.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 16),
                    itemBuilder: (context, index) {
                      return _buildOfferCard(_offers[index]);
                    },
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return  Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.secondary.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.secondary, size: 20),
        ),
        const SizedBox(width: 12),
        Text(
          title, 
          style: AppTextStyles.h3.copyWith(fontSize: 18)
        ),
      ],
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    final isSelected = _selectedService == service;
    // Determine icon based on name
    IconData icon = Icons.directions_car_filled_rounded;
    if (service['name'].toString().toLowerCase().contains('round')) icon = Icons.sync_rounded;
    if (service['name'].toString().toLowerCase().contains('rental')) icon = Icons.access_time_filled_rounded;

    return GestureDetector(
      onTap: () => setState(() => _selectedService = service),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 100,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.secondary : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.secondary : Colors.white24,
            width: isSelected ? 0 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : Colors.white,
              size: 28,
            ),
            const SizedBox(height: 8),
            Text(
              service['name'] ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? AppColors.primary : Colors.white70,
                fontSize: 12,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
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
        formattedDate = DateFormat('dd MMM, hh:mm a').format(DateTime.parse(date));
      } catch (e) {
        formattedDate = date.toString();
      }
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      serviceType, 
                      style: AppTextStyles.h3.copyWith(fontSize: 16),
                    ),
                    Text(
                      'ID: $bookingId', 
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(status, style: AppTextStyles.label.copyWith(fontSize: 12)),
                ),
              ],
            ),
            const Divider(height: 24),
             Row(
               children: [
                 const Icon(Icons.circle, color: AppColors.success, size: 12),
                 const SizedBox(width: 12),
                 Expanded(child: Text(pickup ?? '', style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis)),
               ],
             ),
             Padding(
               padding: const EdgeInsets.only(left: 5),
               child: Container(height: 12, width: 2, color: AppColors.border),
             ),
              Row(
               children: [
                 const Icon(Icons.circle, color: AppColors.error, size: 12),
                 const SizedBox(width: 12),
                 Expanded(child: Text(drop ?? '', style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis)),
               ],
             ),
            const Divider(height: 24),
             Row(
               mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 16, color: AppColors.textTertiary),
                    const SizedBox(width: 8),
                    Text(formattedDate, style: AppTextStyles.bodySmall),
                  ],
                ),
                Text('₹$amount', style: AppTextStyles.h3.copyWith(color: AppColors.secondary)),
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
      width: 240,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, 4),
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
                        return Container(color: isPromo ? AppColors.secondary : AppColors.success);
                      },
                    )
                  : Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isPromo 
                              ? [AppColors.secondary, Colors.orange] 
                              : [AppColors.success, Colors.teal],
                        ),
                      ),
                    ),
            ),
            
            // Text Content
            if (bannerImage == null || bannerImage.toString().isEmpty)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title, 
                    style: AppTextStyles.h3.copyWith(color: Colors.white),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    desc, 
                    style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70),
                    maxLines: 2, 
                    overflow: TextOverflow.ellipsis
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
