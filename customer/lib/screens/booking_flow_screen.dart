import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';
import '../models/customer_models.dart';
import 'location_search_screen.dart';
import 'vehicle_selection_screen.dart';

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
  DateTime? _returnDate;
  String? _selectedService;
  List<Service> _services = [];
  bool _loading = false;
  final _api = CustomerApiClient(baseUrl: kApiBaseUrl);

  @override
  void initState() {
    super.initState();
    _pickupDateTime = DateTime.now().add(const Duration(hours: 1));
    _loadServices();
  }

  Future<void> _loadServices() async {
    try {
      final resp = await _api.getServices(token: widget.token);
      if (resp.success && resp.body['data'] != null) {
        final list = resp.body['data'] as List<dynamic>;
        _services = list.map((e) => Service.fromJson(e as Map<String, dynamic>)).toList();
        if (_services.isNotEmpty) {
          _selectedService = _services.first.name;
        }
      } else {
        _services = [];
        _selectedService ??= 'One Way';
      }
      setState(() {});
    } catch (_) {
      _selectedService ??= 'One Way';
    }
  }

  Future<void> _selectPickupLocation() async {
    final location = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          title: 'Pickup',
          initialQuery: _pickupLocation?['address'] as String?,
          token: widget.token,
        ),
      ),
    );

    if (location != null) {
      setState(() {
        _pickupLocation = location;
      });
    }
  }

  Future<void> _selectDropLocation() async {
    final location = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          title: 'Drop-off',
          initialQuery: _dropLocation?['address'] as String?,
          token: widget.token,
        ),
      ),
    );

    if (location != null) {
      setState(() {
        _dropLocation = location;
      });
    }
  }

  Future<void> _selectDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _pickupDateTime ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_pickupDateTime ?? DateTime.now()),
      );

      if (time != null) {
        setState(() {
          _pickupDateTime = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
          if (_returnDate != null && _returnDate!.isBefore(_pickupDateTime!)) {
            _returnDate = _pickupDateTime;
          }
        });
      }
    }
  }

  Future<void> _selectReturnDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _returnDate ?? _pickupDateTime ?? DateTime.now(),
      firstDate: _pickupDateTime ?? DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() {
        _returnDate = date;
      });
    }
  }

  Future<void> _searchVehicles() async {
    if (_pickupLocation == null || _dropLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select pickup and drop locations'),
        ),
      );
      return;
    }
    if (_pickupDateTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select pickup date and time'),
        ),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final resp = await _api.getEstimation(
        token: widget.token,
        pickUp: _pickupLocation?['address'] as String? ?? '',
        drop: _dropLocation?['address'] as String? ?? '',
        pickupDateTime: _pickupDateTime!,
        dropDate: _returnDate?.toIso8601String(),
        serviceType: _selectedService ?? 'One Way',
      );

      if (!resp.success || resp.body['data'] == null) {
        final message = resp.body['message'] ?? 'Failed to fetch fares';
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message.toString())),
          );
        }
        return;
      }

      final serviceId = resp.body['serviceId']?.toString();
      final data = resp.body['data'] as Map<String, dynamic>? ?? {};
      final vehicles = _normalizeVehicles(data);

      if (vehicles.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No vehicles available for the route')),
          );
        }
        return;
      }

      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => VehicleSelectionScreen(
              token: widget.token,
              pickupLocation: _pickupLocation!,
              dropLocation: _dropLocation!,
              pickupDateTime: _pickupDateTime!,
              returnDate: _returnDate,
              serviceType: _selectedService ?? 'One Way',
              serviceId: serviceId,
              vehicles: vehicles,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch fares: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<EstimatedVehicle> _normalizeVehicles(Map<String, dynamic> data) {
    if (data['vehicles'] is List) {
      final vehicles = data['vehicles'] as List<dynamic>;
      return vehicles
          .map((e) => EstimatedVehicle.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    if (data['packages'] is List) {
      final packages = data['packages'] as List<dynamic>;
      final result = <EstimatedVehicle>[];
      for (final pkg in packages) {
        final pkgMap = pkg as Map<String, dynamic>;
        final vehicles = pkgMap['vehicles'] as List<dynamic>? ?? [];
        for (final vehicle in vehicles) {
          final vMap = vehicle as Map<String, dynamic>;
          final fare = {
            'packageId': vMap['packageId'],
            'packageName': pkgMap['packageDisplayName'],
            'finalPrice': vMap['finalPrice'] ?? vMap['packagePrice'] ?? 0,
            'estimatedPrice': vMap['estimatedPrice'] ?? vMap['packagePrice'] ?? 0,
            'distance': pkgMap['kilometers'] ?? 0,
            'driverBeta': vMap['packageDriverBeta'] ?? vMap['driverBeta'],
            'taxPercentage': vMap['packageTaxPercentage'] ?? vMap['taxPercentage'],
            'taxAmount': vMap['taxAmount'],
            'offerAmount': vMap['offerAmount'],
            'offerId': vMap['offerId'],
            'offerName': vMap['offerName'],
          };
          result.add(
            EstimatedVehicle.fromJson({
              'vehicleId': vMap['vehicleId'],
              'vehicleType': vMap['name'] ?? vMap['vehicleType'],
              'vehicleImage': vMap['imageUrl'],
              'packageDisplayName': pkgMap['packageDisplayName'],
              'extraPricePerKm': pkgMap['extraPricePerKm'],
              'fares': [fare],
            }),
          );
        }
      }
      return result;
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    final isRoundTrip = (_selectedService ?? '').toLowerCase().contains('round');
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book a Ride'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pickup Location
            const Text(
              'Pickup',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectPickupLocation,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _pickupLocation?['address'] as String? ?? 'Select your Pickup Point',
                        style: TextStyle(
                          color: _pickupLocation == null ? Colors.grey : Colors.black,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.swap_vert),
                      onPressed: () {
                        final temp = _pickupLocation;
                        setState(() {
                          _pickupLocation = _dropLocation;
                          _dropLocation = temp;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Drop-off Location
            const Text(
              'Drop-off',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectDropLocation,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _dropLocation?['address'] as String? ?? 'Select your Drop Point',
                        style: TextStyle(
                          color: _dropLocation == null ? Colors.grey : Colors.black,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Date of Journey
            const Text(
              'Date of Journey',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectDateTime,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 20),
                    const SizedBox(width: 12),
                    Text(
                      _pickupDateTime != null
                          ? DateFormat('EEE d-MMM, h:mm a').format(_pickupDateTime!)
                          : 'Select date and time',
                      style: TextStyle(
                        color: _pickupDateTime == null ? Colors.grey : Colors.black,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            if (isRoundTrip) ...[
              const SizedBox(height: 16),
              const Text(
                'Return Date',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _selectReturnDate,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_month, size: 20),
                      const SizedBox(width: 12),
                      Text(
                        _returnDate != null
                            ? DateFormat('EEE d-MMM').format(_returnDate!)
                            : 'Select return date',
                        style: TextStyle(
                          color: _returnDate == null ? Colors.grey : Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

            Text(
              'Trip Type',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: (_services.isNotEmpty
                      ? _services.map((e) => e.name).toList()
                      : ['One Way', 'Round Trip'])
                  .map(
                    (name) => ChoiceChip(
                      label: Text(name),
                      selected: _selectedService == name,
                      onSelected: (_) {
                        setState(() {
                          _selectedService = name;
                        });
                      },
                    ),
                  )
                  .toList(),
            ),

            const SizedBox(height: 32),

            // Search Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _searchVehicles,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.amber,
                  foregroundColor: Colors.black,
                ),
                child: _loading
                    ? const CircularProgressIndicator()
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search),
                          SizedBox(width: 8),
                          Text(
                            'Search',
                            style: TextStyle(
                              fontSize: 16,
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
    );
  }
}
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';
import 'location_search_screen.dart';
import 'vehicle_selection_screen.dart';
import 'booking_review_screen.dart';

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
  String _tripType = 'one_way';

  @override
  void initState() {
    super.initState();
    _pickupDateTime = DateTime.now().add(const Duration(hours: 1));
  }

  Future<void> _selectPickupLocation() async {
    final location = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          title: 'Pickup',
          initialQuery: _pickupLocation?['address'] as String?,
        ),
      ),
    );

    if (location != null) {
      setState(() {
        _pickupLocation = location;
      });
    }
  }

  Future<void> _selectDropLocation() async {
    final location = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          title: 'Drop-off',
          initialQuery: _dropLocation?['address'] as String?,
        ),
      ),
    );

    if (location != null) {
      setState(() {
        _dropLocation = location;
      });
    }
  }

  Future<void> _selectDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _pickupDateTime ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_pickupDateTime ?? DateTime.now()),
      );

      if (time != null) {
        setState(() {
          _pickupDateTime = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  void _proceedToVehicleSelection() {
    if (_pickupLocation == null || _dropLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select pickup and drop locations'),
        ),
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
          tripType: _tripType,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book a Ride'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pickup Location
            const Text(
              'Pickup',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectPickupLocation,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _pickupLocation?['address'] as String? ?? 'Select your Pickup Point',
                        style: TextStyle(
                          color: _pickupLocation == null ? Colors.grey : Colors.black,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.swap_vert),
                      onPressed: () {
                        // Swap pickup and drop
                        final temp = _pickupLocation;
                        setState(() {
                          _pickupLocation = _dropLocation;
                          _dropLocation = temp;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Drop-off Location
            const Text(
              'Drop-off',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectDropLocation,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _dropLocation?['address'] as String? ?? 'Select your Drop Point',
                        style: TextStyle(
                          color: _dropLocation == null ? Colors.grey : Colors.black,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add),
                      onPressed: () {
                        // Add multiple drop points (future feature)
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Date of Journey
            const Text(
              'Date of Journey',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _selectDateTime,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 20),
                    const SizedBox(width: 12),
                    Text(
                      _pickupDateTime != null
                          ? DateFormat('EEE d-MMM, h:mm a').format(_pickupDateTime!)
                          : 'Select date and time',
                      style: TextStyle(
                        color: _pickupDateTime == null ? Colors.grey : Colors.black,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Trip Type Selection
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _tripType = 'one_way';
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _tripType == 'one_way' ? Colors.amber : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _tripType == 'one_way' ? Colors.amber : Colors.grey[300]!,
                        ),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'One Way Trip',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _tripType == 'one_way' ? Colors.black : Colors.grey,
                                ),
                              ),
                              if (_tripType == 'one_way')
                                const Padding(
                                  padding: EdgeInsets.only(left: 8),
                                  child: Icon(Icons.check_circle, color: Colors.black, size: 20),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Get Drop Off',
                            style: TextStyle(
                              fontSize: 12,
                              color: _tripType == 'one_way' ? Colors.black87 : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _tripType = 'round_trip';
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _tripType == 'round_trip' ? Colors.amber : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _tripType == 'round_trip' ? Colors.amber : Colors.grey[300]!,
                        ),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Round Trip',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _tripType == 'round_trip' ? Colors.black : Colors.grey,
                                ),
                              ),
                              if (_tripType == 'round_trip')
                                const Padding(
                                  padding: EdgeInsets.only(left: 8),
                                  child: Icon(Icons.check_circle, color: Colors.black, size: 20),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Keep Cab Till Return',
                            style: TextStyle(
                              fontSize: 12,
                              color: _tripType == 'round_trip' ? Colors.black87 : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Search Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _proceedToVehicleSelection,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.amber,
                  foregroundColor: Colors.black,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.search),
                    SizedBox(width: 8),
                    Text(
                      'Search',
                      style: TextStyle(
                        fontSize: 16,
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
    );
  }
}

