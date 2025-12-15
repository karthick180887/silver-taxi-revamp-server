import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../design_system.dart';
import 'location_search_screen.dart';
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

  bool _isLoadingServices = true;
  List<dynamic> _services = [];
  Map<String, dynamic>? _selectedService;
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);

  @override
  void initState() {
    super.initState();
    _pickupDateTime = DateTime.now().add(const Duration(minutes: 15));
    _fetchServices();
  }

  Future<void> _fetchServices() async {
    try {
      // Assuming admin-1 for now, ideally should come from config/profile
      final result = await _apiClient.getServices(
        token: widget.token,
        adminId: 'admin-1', 
      );
      
      if (mounted) {
        setState(() {
          _isLoadingServices = false;
          if (result.success && result.body['data'] != null) {
            _services = result.body['data'];
            if (_services.isNotEmpty) {
              _selectedService = _services[0];
            }
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingServices = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load services: $e')),
        );
      }
    }
  }

  Future<void> _selectPickupLocation() async {
    final location = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          title: 'Pickup Location',
          initialQuery: _pickupLocation?['address'] as String?,
        ),
      ),
    );
    if (location != null && mounted) setState(() => _pickupLocation = location);
  }

  Future<void> _selectDropLocation() async {
    final location = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          title: 'Drop Location',
          initialQuery: _dropLocation?['address'] as String?,
        ),
      ),
    );
    if (location != null && mounted) setState(() => _dropLocation = location);
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
          // Pass service name as tripType for backward compatibility/display
          tripType: _selectedService!['name'], 
          serviceId: _selectedService!['serviceId'],
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
            // Location Card
            Card(
              elevation: 2,
              shadowColor: Colors.black12,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildLocationRow(
                      icon: Icons.my_location,
                      iconColor: AppColors.success,
                      label: 'Pickup Location',
                      value: _pickupLocation?['address'] ?? 'Select Pickup',
                      isPlaceholder: _pickupLocation == null,
                      onTap: _selectPickupLocation,
                    ),
                    const Padding(
                      padding: EdgeInsets.only(left: 20),
                      child: Divider(height: 24),
                    ),
                    _buildLocationRow(
                      icon: Icons.location_on,
                      iconColor: AppColors.error,
                      label: 'Drop Location',
                      value: _dropLocation?['address'] ?? 'Select Drop',
                      isPlaceholder: _dropLocation == null,
                      onTap: _selectDropLocation,
                      isLast: true,
                    ),
                  ],
                ),
              ),
            ),
            
            // Swap Button (Centered over divider logic - simplified here as external button)
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

            const SizedBox(height: 16),

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
          ],
        ),
      ),
    );
  }

  Widget _buildLocationRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required bool isPlaceholder,
    required VoidCallback onTap,
    bool isLast = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: AppTextStyles.bodySmall),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: isPlaceholder ? AppColors.textLight : AppColors.textMain,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
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
