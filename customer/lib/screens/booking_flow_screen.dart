import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../design_system.dart';
import '../widgets/inline_location_search.dart';  // Import custom widget
import 'vehicle_selection_screen.dart';
import '../api_client.dart';

class BookingFlowScreen extends StatefulWidget {
  const BookingFlowScreen({super.key, required this.token});
  final String token;

  @override
  State<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends State<BookingFlowScreen> {
  Map<String, dynamic>? _pickupLocation;
  Map<String, dynamic>? _dropLocation;
  DateTime? _pickupDateTime;
  String? _phone;

  bool _isLoadingServices = true;
  List<dynamic> _services = [];
  Map<String, dynamic>? _selectedService;
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  String _googleMapsKey = '';

  @override
  void initState() {
    super.initState();
    _pickupDateTime = DateTime.now().add(const Duration(minutes: 15));
    _fetchServices();
    _fetchGoogleMapsKey();
    _fetchUserPhone();
  }

  Future<void> _fetchUserPhone() async {
    final prefs = await SharedPreferences.getInstance();
    String? storedPhone = prefs.getString('customer_phone');
    
    if (storedPhone == null) {
      // Fallback: Fetch from API for existing sessions
      try {
        final result = await _apiClient.getCustomerDetails(
          token: widget.token,
          // Rely on backend to extract customerId and adminId from token
        );
        if (result.success && result.body['data'] != null) {
          storedPhone = result.body['data']['phone'];
          if (storedPhone != null) {
            await prefs.setString('customer_phone', storedPhone);
          }
        }
      } catch (e) {
        debugPrint('Error fetching user phone: $e');
      }
    }

    if (mounted) {
      setState(() => _phone = storedPhone);
      print('DEBUG: BookingFlowScreen fetched phone: $_phone');
    }
  }

  Future<void> _fetchGoogleMapsKey() async {
    try {
      final result = await _apiClient.getConfigKeys(
        token: widget.token,
        adminId: 'admin-1',
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
        adminId: 'admin-1', 
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
          data: AppTheme.lightTheme.copyWith(
            colorScheme: const ColorScheme.light(primary: AppColors.primary),
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
            data: AppTheme.lightTheme.copyWith(
              colorScheme: const ColorScheme.light(primary: AppColors.primary),
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

  void _proceedToVehicleSelection() {
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
          phone: _phone,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Plan Your Ride'),
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Location Inputs (Inline)
            Card(
               elevation: 0,
               color: Colors.transparent,
               margin: EdgeInsets.zero,
               child: Column(
                 children: [
                   InlineLocationSearch(
                     label: 'Pickup Location',
                     icon: Icons.my_location,
                     iconColor: AppColors.success,
                     googleMapsKey: _googleMapsKey,
                     initialAddress: _pickupLocation?['address'],
                     onLocationSelected: (loc) => setState(() => _pickupLocation = loc),
                   ),
                   const SizedBox(height: 16),
                   InlineLocationSearch(
                     label: 'Drop Location',
                     icon: Icons.location_on,
                     iconColor: AppColors.error,
                     googleMapsKey: _googleMapsKey,
                     initialAddress: _dropLocation?['address'],
                     onLocationSelected: (loc) => setState(() => _dropLocation = loc),
                   ),
                 ],
               ),
            ),
            
            // Swap Button
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () {
                  final temp = _pickupLocation;
                  setState(() {
                    _pickupLocation = _dropLocation;
                    _dropLocation = temp;
                  });
                },
                icon: const Icon(Icons.swap_vert),
                label: const Text('Swap Locations'),
              ),
            ),

            const SizedBox(height: 8),

            // Date & Time
            Text('When', style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectDateTime,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today_rounded, color: AppColors.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _pickupDateTime != null
                            ? DateFormat('EEE, d MMM • h:mm a').format(_pickupDateTime!)
                            : 'Select Date & Time',
                        style: AppTextStyles.bodyLarge,
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textLight),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Services
            Text('Service Type', style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            _isLoadingServices
                ? const Center(child: CircularProgressIndicator())
                : SizedBox(
                    height: 100, // Fixed height for horizontal list
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _services.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final service = _services[index];
                        return _buildServiceCard(service);
                      },
                    ),
                  ),

            const SizedBox(height: 40),

            // Search Button
            ElevatedButton(
              onPressed: _proceedToVehicleSelection,
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Find Ride'),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward),
                ],
              ),
            ),
            
            // Extra spacing for keyboard handling
            SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 20),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    final isSelected = _selectedService == service;
    // Determine icon based on name or default
    IconData icon = Icons.directions_car;
    if (service['name'].toString().toLowerCase().contains('round')) icon = Icons.loop;
    if (service['name'].toString().toLowerCase().contains('rental')) icon = Icons.timer;

    return GestureDetector(
      onTap: () => setState(() => _selectedService = service),
      child: Container(
        width: 120,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.1) : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
            ),
            const SizedBox(height: 8),
            Text(
              service['name'] ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
